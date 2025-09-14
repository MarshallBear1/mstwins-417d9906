import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Users, MessageCircle, Sparkles, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { useEffect, useState } from "react";

const MobileHome = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SEO 
        title="Join MSTwins - MS Support Community"
        description="Connect with others living with Multiple Sclerosis. Find friendship, support, and understanding in our community."
        canonical="https://mstwins.com/"
      />
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Floating orbs */}
        <div className="absolute top-20 left-4 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-40 right-8 w-24 h-24 bg-accent/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-8 w-40 h-40 bg-success/8 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-60 right-4 w-28 h-28 bg-primary/8 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-12 mobile-safe-top mobile-safe-bottom">
        <div className="text-center space-y-10 max-w-sm mx-auto">
          
          {/* Mobile welcome copy */}
          <div className={`space-y-6 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto shadow-xl-modern rotate-3 hover:rotate-0 transition-transform duration-500">
                <Heart className="w-12 h-12 text-white drop-shadow-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <Star className="absolute -top-2 -left-3 w-4 h-4 text-accent animate-pulse" />
              <Star className="absolute -bottom-1 -right-4 w-3 h-3 text-primary animate-pulse delay-700" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-foreground">Hi. It’s great to meet you.</h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                I'm excited to get you in touch with other people in the community.
                No dating. Events. Chat. Join thousands of people.
              </p>
            </div>
          </div>

          {/* Single-screen CTA */}
          <div className="space-y-4" />

          {/* CTA Section */}
          <div className={`space-y-6 pt-6 transition-all duration-1000 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="relative">
              <Button 
                size="lg" 
                className="w-full text-lg py-7 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-light shadow-strong hover:shadow-xl-modern transition-all duration-300 transform hover:scale-105 font-bold rounded-2xl" 
                asChild
              >
                <Link to="/auth" className="relative overflow-hidden">
                  <span className="relative z-10">Join Free Today</span>
                  <ArrowRight className="ml-3 h-6 w-6 relative z-10 transition-transform group-hover:translate-x-1" />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -top-full bg-gradient-to-b from-transparent via-white/20 to-transparent transform rotate-12 group-hover:animate-pulse"></div>
                </Link>
              </Button>
              
              {/* Floating elements around button */}
              <Heart className="absolute -top-3 -left-2 w-5 h-5 text-accent animate-bounce" />
              <Sparkles className="absolute -top-2 -right-3 w-4 h-4 text-primary animate-bounce delay-300" />
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <p className="text-sm text-muted-foreground">Free forever • Your privacy matters • Join in under 60 seconds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHome;