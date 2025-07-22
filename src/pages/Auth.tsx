import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, ArrowLeft, Mail, Lock, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true); // Default to sign up
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, firstName, lastName);
      } else {
        await signIn(email, password);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
          {/* Left side - Robot and Avatar for Sign Up */}
          {isSignUp && (
            <div className="flex-shrink-0 order-2 lg:order-1">
              <div className="relative flex justify-center animate-fade-in">
                <div className="relative">
                  {/* Speech bubble */}
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 min-w-max z-10">
                    <p className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      So excited to get you connected to others! 🎉
                    </p>
                    {/* Speech bubble tail */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-white"></div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-[-1px] w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-200"></div>
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
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {isSignUp ? "Get Started" : "Welcome Back"}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {isSignUp 
                    ? "Create your account to start connecting with others who understand your journey" 
                    : "Sign in to reconnect with your community"
                  }
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 px-8 pb-8">
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
                  </div>

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

                {!isSignUp && (
                  <div className="text-center">
                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Forgot your password?
                    </button>
                  </div>
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