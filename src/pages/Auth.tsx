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
import { useAnalytics } from "@/hooks/useAnalytics";

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
  
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackAuthPageEntered, trackAuthAttempted } = useAnalytics();

  // Use security monitoring
  useSecurityMonitoring();

  // Track auth page entry
  useEffect(() => {
    trackAuthPageEntered(isSignUp ? 'signup' : 'signin');
  }, [isSignUp, trackAuthPageEntered]);

  // Check for password reset parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const type = urlParams.get('type') || hashParams.get('type');
    const code = urlParams.get('code') || hashParams.get('code');
    const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
    
    console.log('🔑 Auth page password reset check:', {
      url: window.location.href,
      type,
      hasCode: !!code,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      urlParams: Object.fromEntries(urlParams.entries()),
      hashParams: Object.fromEntries(hashParams.entries()),
      pathname: window.location.pathname,
      hash: window.location.hash,
      search: window.location.search
    });
    
    if (type === 'recovery') {
      console.log('🔑 Recovery type detected, redirecting to password reset page');
      // Redirect to password reset page to handle all recovery flows
      window.location.href = `/password-reset${window.location.search}${window.location.hash}`;
    }
  }, [toast]);


  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      console.log('👤 User authenticated, redirecting to dashboard');
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handlePasswordValidation = (isValid: boolean, errors: string[]) => {
    setPasswordValid(isValid);
    setPasswordErrors(errors);
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
      
      // Dynamic redirect URL based on current environment
      const redirectUrl = `${window.location.origin}/password-reset`;
      console.log('🔗 Using redirect URL:', redirectUrl);
      
      // Use recovery flow instead of magic link
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: redirectUrl,
        // This will send a recovery email instead of a magic link
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
          title: "Password Reset Email Sent! 📧",
          description: "Check your email for a password reset link. Click the link to set a new password securely.",
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
          // Track successful signup
          trackAuthAttempted('signup', true);
          
          toast({
            title: "Account Created!",
            description: "Please check your email to verify your account.",
          });
        } else {
          const result = await signIn(email, password);
          if (!result.error) {
            // Track successful signin
            trackAuthAttempted('signin', true);
            
            // Clear failed login attempts on successful login
            await clearFailedLogins(email);
          } else {
            // Track failed signin
            trackAuthAttempted('signin', false, result.error?.message);
            
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
        
        // Track failed auth attempt
        trackAuthAttempted(isSignUp ? 'signup' : 'signin', false, authError?.message);
        
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      <SEO 
        title={`${isSignUp ? 'Join MSTwins' : 'Sign In to MSTwins'}`}
        description={`${isSignUp ? 'Create your free account and connect with others living with Multiple Sclerosis in our supportive community.' : 'Sign in to access your MSTwins account and connect with your MS support network.'}`}
        canonical="https://mstwins.com/auth"
      />
      <SecurityEnhancements />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {/* Back to Home Button - Mobile Optimized */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-20 text-gray-600 hover:text-gray-900 hover:bg-white/90 backdrop-blur-md rounded-full transition-all duration-300 shadow-lg border border-white/20 md:top-6 md:left-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
        <span className="hidden sm:inline">Back to Home</span>
        <span className="sm:hidden">Back</span>
      </Button>

      {/* Mobile Fullscreen Container */}
      <div className="flex flex-col min-h-screen md:flex-row md:items-center md:justify-center md:p-6">
        {/* Mobile Header - Only visible on mobile */}
        <div className="md:hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white pt-16 pb-8 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 text-center">
            {/* Logo */}
            <div className="w-20 h-20 bg-white/20 rounded-2xl mx-auto mb-6 flex items-center justify-center backdrop-blur-sm">
              <img 
                src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                alt="MStwins" 
                className="w-12 h-12 object-contain" 
              />
            </div>
            
            <h1 className="text-3xl font-bold mb-3">
              {showForgotPassword ? "Reset Password" : 
               isSignUp ? "Join MSTwins" : "Welcome Back"}
            </h1>
            <p className="text-blue-100 text-lg opacity-90">
              {showForgotPassword ? "Enter your email to reset your password" :
               isSignUp ? "Connect with others who understand your MS journey" : 
               "Sign in to your support community"}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 md:flex-none md:w-full md:max-w-md md:mx-auto">
          {/* Desktop Card */}
          <Card className="hidden md:block border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20">
            <CardHeader className="pb-8 pt-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                {/* Desktop Logo */}
                <div className="w-20 h-20 bg-white/20 rounded-2xl mx-auto mb-6 flex items-center justify-center backdrop-blur-sm">
                  <img 
                    src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                    alt="MStwins" 
                    className="w-12 h-12 object-contain" 
                  />
                </div>
                
                <CardTitle className="text-3xl font-bold mb-3">
                  {showForgotPassword ? "Reset Password" : 
                   isSignUp ? "Join MSTwins" : "Welcome Back"}
                </CardTitle>
                <CardDescription className="text-blue-100 text-lg">
                  {showForgotPassword ? "Enter your email to reset your password" :
                   isSignUp ? "Connect with others who understand your MS journey" : 
                   "Sign in to your support community"}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-10">
              {rateLimitMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{rateLimitMessage}</p>
                </div>
              )}

              {showForgotPassword ? (
                // Forgot Password Form
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="space-y-3">
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
                        className="pl-10 h-14 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors text-base"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-base"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending Reset Link...
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl h-12"
                  >
                    Back to Sign In
                  </Button>
                </form>
              ) : (
                // Main Auth Form
                <form onSubmit={handleSubmit} className="space-y-6">
                  {isSignUp && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="h-14 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors text-base"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="h-14 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors text-base"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
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
                        className="pl-10 h-14 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
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
                        className="pl-10 h-14 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors text-base"
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
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {isSignUp ? "Creating Account..." : "Signing In..."}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {isSignUp ? "Create Account" : "Sign In"}
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Button>

                  {!isSignUp && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForgotPassword(true)}
                      className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl h-12"
                    >
                      Forgot your password?
                    </Button>
                  )}
                </form>
              )}

              {!showForgotPassword && (
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

          {/* Mobile Form - Only visible on mobile */}
          <div className="md:hidden bg-white/95 backdrop-blur-xl flex-1 min-h-0">
            <div className="px-6 py-8">
              {rateLimitMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{rateLimitMessage}</p>
                </div>
              )}

              {showForgotPassword ? (
                // Mobile Forgot Password Form
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="mobileEmailForgot" className="text-base font-semibold text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="mobileEmailForgot"
                        type="email"
                        placeholder="Enter your email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="pl-12 h-16 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition-colors text-lg"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-2xl h-14 text-base"
                  >
                    Back to Sign In
                  </Button>
                </form>
              ) : (
                // Mobile Main Auth Form
                <form onSubmit={handleSubmit} className="space-y-6">
                  {isSignUp && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label htmlFor="mobileFirstName" className="text-base font-semibold text-gray-700">
                          First Name
                        </Label>
                        <Input
                          id="mobileFirstName"
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="h-16 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition-colors text-lg px-4"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="mobileLastName" className="text-base font-semibold text-gray-700">
                          Last Name
                        </Label>
                        <Input
                          id="mobileLastName"
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="h-16 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition-colors text-lg px-4"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="mobileEmail" className="text-base font-semibold text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="mobileEmail"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-16 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition-colors text-lg"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="mobilePassword" className="text-base font-semibold text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="mobilePassword"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-16 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition-colors text-lg"
                        required
                      />
                    </div>
                    {isSignUp && (
                      <div className="mt-3">
                        <PasswordStrengthIndicator 
                          password={password} 
                          onValidationChange={handlePasswordValidation}
                        />
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading || (isSignUp && !passwordValid)}
                    className="w-full h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {isSignUp ? "Creating Account..." : "Signing In..."}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {isSignUp ? "Create Account" : "Sign In"}
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    )}
                  </Button>

                  {!isSignUp && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForgotPassword(true)}
                      className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-2xl h-14 text-base"
                    >
                      Forgot your password?
                    </Button>
                  )}
                </form>
              )}

              {!showForgotPassword && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-center text-gray-600 text-base">
                    {isSignUp ? "Already have an account?" : "New to MSTwins?"}
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold rounded-2xl h-14 text-lg"
                  >
                    {isSignUp ? "Sign In" : "Create Account"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trust indicators - Always visible */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10 text-center space-y-2 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-white/20">
        <p className="text-sm text-gray-600 font-medium">
          🔒 Your data is secure and private
        </p>
        <p className="text-xs text-gray-500">
          Join 500+ members in our supportive MS community
        </p>
      </div>
    </div>
  );
};

export default Auth;