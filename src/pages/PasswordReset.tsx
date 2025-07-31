import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";

const PasswordReset = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [passwordResetComplete, setPasswordResetComplete] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for password reset tokens/code on page load
  useEffect(() => {
    const checkResetToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const type = urlParams.get('type') || hashParams.get('type');
      const code = urlParams.get('code') || hashParams.get('code');
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
      
      console.log('🔑 Password reset page - checking tokens:', {
        url: window.location.href,
        type,
        hasCode: !!code,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      });
      
      if (type === 'recovery') {
        // For recovery flow, we need to set the session first to enable password update
        if (accessToken && refreshToken) {
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('❌ Error setting session:', error);
              setIsTokenValid(false);
              toast({
                title: "Invalid Reset Link",
                description: "This password reset link is invalid or has expired. Please request a new one.",
                variant: "destructive",
              });
            } else {
              console.log('✅ Session set successfully for password reset');
              setIsTokenValid(true);
              toast({
                title: "Reset Your Password",
                description: "Please enter your new password below.",
              });
            }
          } catch (error) {
            console.error('❌ Error during session setup:', error);
            setIsTokenValid(false);
          }
        } else if (code) {
          // For code-based recovery, we need to exchange the code for a session
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token: code,
              type: 'recovery',
              email: '' // Will be ignored for recovery type
            });
            
            if (error) {
              console.error('❌ Error verifying recovery code:', error);
              setIsTokenValid(false);
              toast({
                title: "Invalid Reset Link",
                description: "This password reset link is invalid or has expired. Please request a new one.",
                variant: "destructive",
              });
            } else {
              console.log('✅ Recovery code verified successfully');
              setIsTokenValid(true);
              toast({
                title: "Reset Your Password",
                description: "Please enter your new password below.",
              });
            }
          } catch (error) {
            console.error('❌ Error during code validation:', error);
            setIsTokenValid(false);
          }
        } else {
          // No valid tokens found
          setIsTokenValid(false);
          toast({
            title: "Invalid Reset Link",
            description: "This password reset link is invalid or has expired. Please request a new one.",
            variant: "destructive",
          });
        }
      } else {
        // No recovery type found
        setIsTokenValid(false);
        toast({
          title: "Invalid Reset Link",
          description: "This password reset link is invalid. Please request a new one.",
          variant: "destructive",
        });
      }
    };

    checkResetToken();
  }, [toast]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordValid) {
      toast({
        title: "Invalid Password",
        description: "Please fix the password requirements before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Since we have a valid session from the recovery flow, we can update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error('❌ Password reset error:', error);
        toast({
          title: "Password Reset Failed",
          description: error.message || "Failed to reset password. Please try again.",
          variant: "destructive",
        });
      } else {
        console.log('✅ Password reset successful');
        setPasswordResetComplete(true);
        toast({
          title: "Password Reset Successful!",
          description: "Your password has been updated. You can now sign in with your new password.",
        });
        
        // Sign out the user after successful password reset
        await supabase.auth.signOut();
        
        // Redirect to auth page after a short delay
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Unexpected error during password reset:', error);
      toast({
        title: "Password Reset Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking token validity
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Verifying reset link...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if token is invalid
  if (isTokenValid === false) {
    return (
      <>
        <SEO 
          title="Invalid Reset Link - MStwins"
          description="Password reset link is invalid or expired"
        />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link to="/auth">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Request New Reset Link
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Show success state if password reset is complete
  if (passwordResetComplete) {
    return (
      <>
        <SEO 
          title="Password Reset Complete - MStwins"
          description="Your password has been successfully reset"
        />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Password Reset Complete!</CardTitle>
              <CardDescription>
                Your password has been successfully updated. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link to="/auth">
                  Continue to Sign In
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Main password reset form
  return (
    <>
      <SEO 
        title="Reset Password - MStwins"
        description="Reset your password to regain access to your MStwins account"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>
              Enter your new password below to complete the reset process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                />
                <PasswordStrengthIndicator 
                  password={newPassword}
                  onValidationChange={(isValid, errors) => {
                    setPasswordValid(isValid);
                    setPasswordErrors(errors);
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">Passwords don't match</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !passwordValid || newPassword !== confirmPassword}
              >
                {loading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Link to="/auth" className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PasswordReset;