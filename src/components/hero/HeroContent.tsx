
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowRight, Star, Users, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const HeroContent = () => {
  return (
    <div className="text-center lg:text-left space-y-8 animate-fade-in">
      {/* Trust Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
        <Heart className="w-4 h-4" fill="currentColor" />
        Trusted by 1,000+ MS community members
      </div>
      
      {/* Main Headline */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
        Find Your{" "}
        <span className="bg-gradient-hero bg-clip-text text-transparent">
          MS Support
        </span>
        <span className="block">Network</span>
      </h1>
      
      {/* Value Proposition */}
      <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
        Connect with others who truly understand your Multiple Sclerosis journey. 
        Build meaningful friendships, share experiences, and find support in our safe community.
      </p>

      {/* Social Proof Stats */}
      <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">1,000+ active members</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">10,000+ connections made</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-accent" fill="currentColor" />
          <span className="text-sm text-muted-foreground">4.9/5 member satisfaction</span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
        <Button 
          variant="hero" 
          size="lg" 
          className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white shadow-strong" 
          asChild
        >
          <Link to="/auth">
            Join Free Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          className="text-lg px-8 py-4 border-2 border-primary text-primary hover:bg-primary hover:text-white"
          asChild
        >
          <Link to="#how-it-works">
            See How It Works
          </Link>
        </Button>
      </div>

      {/* Trust Indicators */}
      <div className="flex items-center gap-4 justify-center lg:justify-start text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-success rounded-full"></div>
          <span>100% Free</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-success rounded-full"></div>
          <span>Private & Secure</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-success rounded-full"></div>
          <span>No Dating</span>
        </div>
      </div>
    </div>
  );
};

export default HeroContent;
