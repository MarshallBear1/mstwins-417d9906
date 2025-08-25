import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Users, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

const MobileHome = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <SEO 
        title="Join MSTwins - MS Support Community"
        description="Connect with others living with Multiple Sclerosis. Find friendship, support, and understanding in our community."
        canonical="https://mstwins.com/"
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 mobile-safe-top mobile-safe-bottom">
        <div className="text-center space-y-8">
          {/* App Logo/Title */}
          <div className="space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              MSTwins
            </h1>
            <p className="text-lg text-muted-foreground">
              The supportive community for people living with Multiple Sclerosis
            </p>
          </div>

          {/* Key Features */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Connect with Others</h3>
                <p className="text-sm text-muted-foreground">Find people who understand your MS journey</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Share & Support</h3>
                <p className="text-sm text-muted-foreground">Exchange experiences and encouragement</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Find Friendship</h3>
                <p className="text-sm text-muted-foreground">Build meaningful connections and friendships</p>
              </div>
            </div>
          </div>

          {/* Join CTA */}
          <div className="space-y-4 pt-8">
            <Button 
              size="lg" 
              className="w-full text-lg py-6 shadow-strong" 
              asChild
            >
              <Link to="/auth">
                Join Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Join 500+ members in our supportive community
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHome;