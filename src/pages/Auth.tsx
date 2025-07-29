import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, ArrowLeft, Mail, Lock, ArrowRight, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SEO from "@/components/SEO";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { SecurityEnhancements, useSecurityMonitoring } from "@/components/SecurityEnhancements";
import { checkLoginRateLimit, logFailedLogin, clearFailedLogins } from "@/lib/security";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true); // Default to sign up
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use security monitoring
  useSecurityMonitoring();

  // Check for password reset parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (type === 'recovery' && accessToken && refreshToken) {
      // User clicked password reset link
      setIsPasswordReset(true);
      setIsSignUp(false);
      
      // Set the session from the URL parameters
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      
      toast({
        title: "Reset Your Password",
        description: "Please enter your new password below.",
      });
    }
  }, [toast]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handlePasswordValidation = (isValid: boolean, errors: string[]) => {
    setPasswordValid(isValid);
    setPasswordErrors(errors);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Reset Successful! ✅",
          description: "Your password has been updated. You can now sign in with your new password.",
        });
        
        // Clear the URL parameters and reset state
        window.history.replaceState({}, document.title, "/auth");
        setIsPasswordReset(false);
        setNewPassword("");
        setConfirmPassword("");
        setIsSignUp(false);
      }
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Sending password reset email to:', forgotPasswordEmail);
      
      // Use the current origin for the redirect URL
      const redirectUrl = `${window.location.origin}/auth?type=recovery`;
      console.log('Redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        console.error('Password reset error:', error);
        
        // Handle specific error types
        if (error.message.includes('Email not found') || error.message.includes('User not found')) {
          toast({
            title: "Email Not Found",
            description: "No account found with this email address. Please check your email or create a new account.",
            variant: "destructive",
          });
        } else if (error.message.includes('rate limit')) {
          toast({
            title: "Too Many Requests",
            description: "You've requested too many password resets. Please wait before trying again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Reset Error",
            description: error.message || "Failed to send reset email. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        console.log('Password reset email sent successfully');
        toast({
          title: "Reset Link Sent! ✅",
          description: "Check your email for a password reset link. The link will redirect you back here to set a new password.",
        });
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      }
    } catch (error: any) {
      console.error('Password reset exception:', error);
      toast({
        title: "Error",
        description: "Failed to send reset email. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRateLimitMessage("");

    try {
      // Check rate limiting for sign in attempts
      if (!isSignUp) {
        const rateLimitCheck = await checkLoginRateLimit(email);
        if (!rateLimitCheck.allowed) {
          setRateLimitMessage(`Account temporarily locked. ${rateLimitCheck.reason === 'account_locked' ? 'Too many failed attempts.' : ''}`);
          toast({
            title: "Account Locked",
            description: "Too many failed login attempts. Please try again later.",
            variant: "destructive"
          });
          return;
        }
      }

      // Validate password strength for sign up
      if (isSignUp && !passwordValid) {
        toast({
          title: "Password Requirements",
          description: "Please ensure your password meets all security requirements.",
          variant: "destructive"
        });
        return;
      }

      try {
        if (isSignUp) {
          await signUp(email, password, firstName, lastName);
          toast({
            title: "Account Created!",
            description: "Please check your email to verify your account.",
          });
        } else {
          const result = await signIn(email, password);
          if (!result.error) {
            // Clear failed login attempts on successful login
            await clearFailedLogins(email);
          } else {
            // Handle sign-in error
            console.error('Sign-in error:', result.error);
            
            // Log failed login attempt for sign in
            await logFailedLogin(email);

            // Show user-friendly error message based on error type
            let errorMessage = 'Incorrect email or password. Please check your credentials and try again.';
            
            if (result.error?.message?.includes('Email not confirmed')) {
              errorMessage = 'Please check your email and click the verification link before signing in.';
            } else if (result.error?.message?.includes('Invalid login credentials') || 
                       result.error?.message?.includes('invalid_credentials') ||
                       result.error?.message?.includes('Invalid email or password')) {
              errorMessage = 'Incorrect email or password. Please check your credentials and try again.';
            } else if (result.error?.message) {
              errorMessage = result.error.message;
            }
            
            toast({
              title: "Sign In Failed", 
              description: errorMessage,
              variant: "destructive"
            });
            return; // Exit early to avoid success flow
          }
        }
      } catch (authError: any) {
        console.error('Authentication error:', authError);
        
        // Log failed login attempt for sign in
        if (!isSignUp) {
          await logFailedLogin(email);
        }

        // Show user-friendly error message based on error type
        let errorMessage = 'Authentication failed. Please try again.';
        if (!isSignUp) {
          // For sign-in, provide more specific error messages
          if (authError?.message?.includes('Invalid login credentials') || 
              authError?.message?.includes('invalid_credentials') ||
              authError?.message?.includes('Invalid email or password')) {
            errorMessage = 'Incorrect email or password. Please check your credentials and try again.';
          } else if (authError?.message?.includes('Email not confirmed')) {
            errorMessage = 'Please check your email and click the verification link before signing in.';
          } else {
            errorMessage = authError?.message || errorMessage;
          }
        } else {
          errorMessage = authError?.message || errorMessage;
        }
        
        toast({
          title: isSignUp ? "Sign Up Failed" : "Sign In Failed", 
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <SEO 
        title={isSignUp ? "Join MSTwins - MS Support Community" : "Sign In to MSTwins"}
        description={isSignUp ? "Create your free account and connect with others living with Multiple Sclerosis in our supportive community." : "Sign in to access your MSTwins account and connect with your MS support network."}
        canonical="https://mstwins.com/auth"
      />
      <SecurityEnhancements />
      
      <div className="w-full max-w-md">
        {/* Back to landing button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-full p-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Modern auth card */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
          {/* Header with gradient */}
          <CardHeader className="pb-8 pt-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/5" />
            <div className="relative z-10">
              {/* Modern logo */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <img 
                  src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                  alt="MSTwins" 
                  className="w-10 h-10 object-contain" 
                />
              </div>
              
              <CardTitle className="text-2xl font-bold tracking-tight">
                {showForgotPassword ? "Reset Password" : 
                 isPasswordReset ? "Set New Password" :
                 isSignUp ? "Join MSTwins" : "Welcome Back"}
              </CardTitle>
              
              <CardDescription className="text-white/90 text-base mt-2">
                {showForgotPassword ? "Enter your email to reset your password" :
                 isPasswordReset ? "Choose a strong new password" :
                 isSignUp ? "Connect with others who understand your MS journey" : 
                 "Sign in to your support community"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {rateLimitMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{rateLimitMessage}</p>
              </div>
            )}

            {showForgotPassword ? (
              // Forgot Password Form
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="forgotEmail" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="pl-10 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl"
                >
                  Back to Sign In
                </Button>
              </form>
            ) : isPasswordReset ? (
              // Password Reset Form
              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            ) : (
              // Main Auth Form
              <form onSubmit={handleSubmit} className="space-y-6">
                {isSignUp && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
                      required
                    />
                  </div>
                                      {isSignUp && (
                      <PasswordStrengthIndicator 
                        password={password} 
                        onValidationChange={handlePasswordValidation}
                      />
                    )}
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || (isSignUp && !passwordValid)}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isSignUp ? "Creating Account..." : "Signing In..."}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isSignUp ? "Create Account" : "Sign In"}
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>

                {!isSignUp && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForgotPassword(true)}
                    className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl"
                  >
                    Forgot your password?
                  </Button>
                )}
              </form>
            )}

            {!showForgotPassword && !isPasswordReset && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-center text-gray-600">
                  {isSignUp ? "Already have an account?" : "New to MSTwins?"}
                  <Button
                    variant="ghost"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold rounded-lg"
                  >
                    {isSignUp ? "Sign In" : "Create Account"}
                  </Button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trust indicators */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500">
            🔒 Your data is secure and private
          </p>
          <p className="text-xs text-gray-400">
            Join 500+ members in our supportive MS community
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;