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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <SecurityEnhancements />
      <SEO 
        title={isSignUp ? "Join MSTwins - Multiple Sclerosis Support Community | Sign Up Free" : "Sign In to MSTwins - MS Support Community"}
        description={isSignUp ? "Create your free account on MSTwins and connect with others living with Multiple Sclerosis. Find friendship, support, and understanding in our safe community." : "Sign in to your MSTwins account and reconnect with your Multiple Sclerosis support community. Access messages, matches, and more."}
        canonical="https://mstwins.com/auth"
      />
      <div className="w-full max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
          {/* Left side - Robot and Avatar for Sign Up */}
          {isSignUp && !isPasswordReset && (
            <div className="flex-shrink-0 order-2 lg:order-1 lg:mr-8">
              <div className="relative flex justify-center animate-fade-in">
                <div className="relative">
                  {/* Speech bubble - moved further left */}
                  <div className="absolute -bottom-20 left-0 transform -translate-x-4 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 min-w-max z-10">
                    <p className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      So excited to get you connected to others! 🎉
                    </p>
                    {/* Speech bubble tail pointing up - adjusted position */}
                    <div className="absolute bottom-full left-8 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-white"></div>
                    <div className="absolute bottom-full left-8 translate-y-[1px] w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-200"></div>
                  </div>
                  
                  {/* Robot character with slow hover animation */}
                  <div className="w-32 h-32 lg:w-40 lg:h-40 animate-[bounce_3s_ease-in-out_infinite]">
                    <img 
                      src="/lovable-uploads/b96beb62-e747-4db6-b7cd-2de07cde399e.png" 
                      alt="Friendly robot mascot"
                      className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right side - Auth Form */}
          <div className="w-full max-w-lg order-1 lg:order-2">
            {/* Header */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to home
              </Link>
            </div>

            {/* Auth Card */}
            <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
              <CardHeader className="text-center pb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {isPasswordReset 
                    ? "Reset Your Password" 
                    : isSignUp 
                      ? "Join Multiple Sclerosis Support Community" 
                      : "Welcome Back to MS Support"
                  }
                </h1>
                <CardDescription className="text-base mt-2">
                  {isPasswordReset
                    ? "Enter your new password below"
                    : isSignUp 
                      ? "Create your account to start connecting with others who understand your journey" 
                      : "Sign in to reconnect with your community"
                  }
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 px-8 pb-8">
                {isPasswordReset ? (
                  <form onSubmit={handlePasswordReset} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input 
                          id="newPassword" 
                          type="password" 
                          placeholder="Enter new password"
                          className="h-12 pl-12 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          placeholder="Confirm new password"
                          className="h-12 pl-12 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200" 
                      size="lg" 
                      disabled={loading || !newPassword || !confirmPassword}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Updating Password...
                        </div>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {isSignUp && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                          <Input 
                            id="firstName" 
                            placeholder="Sarah" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required={isSignUp}
                            className="h-12 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                          <Input 
                            id="lastName" 
                            placeholder="Johnson"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required={isSignUp}
                            className="h-12 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="sarah@example.com"
                          className="h-12 pl-12 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input 
                          id="password" 
                          type="password" 
                          placeholder="••••••••"
                          className="h-12 pl-12 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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

                    {/* Rate limit warning */}
                    {rateLimitMessage && (
                      <div className="flex items-center p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {rateLimitMessage}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200" 
                      size="lg" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Loading...
                        </div>
                      ) : (
                        <>
                          {isSignUp ? "Create Your Account" : "Sign In"}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {!isPasswordReset && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">or</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        {isSignUp 
                          ? "Already have an account? Sign in instead" 
                          : "Don't have an account? Create one"
                        }
                      </button>
                    </div>
                  </>
                )}

                {!isSignUp && !showForgotPassword && !isPasswordReset && (
                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

                {showForgotPassword && !isPasswordReset && (
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="text-center">
                          <h3 className="font-medium text-gray-900 mb-1">Reset Password</h3>
                          <p className="text-sm text-gray-600">Enter your email to receive a reset link</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="resetEmail" className="text-sm font-medium">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input 
                              id="resetEmail" 
                              type="email" 
                              placeholder="Enter your email"
                              className="h-10 pl-10"
                              value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setShowForgotPassword(false);
                              setForgotPasswordEmail("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            size="sm"
                            className="flex-1"
                            disabled={loading || !forgotPasswordEmail}
                          >
                            {loading ? "Sending..." : "Send Reset Link"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Community Note */}
            <div className="text-center mt-8 p-4 bg-white/50 rounded-xl backdrop-blur-sm">
              <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  🤝 <span className="font-medium">Community focused</span>
                </span>
                <span className="flex items-center gap-1">
                  🚫 <span className="font-medium">Not for dating</span>
                </span>
                <span className="flex items-center gap-1">
                  💙 <span className="font-medium">MS support network</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;