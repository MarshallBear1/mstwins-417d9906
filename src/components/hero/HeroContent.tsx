import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowRight, Star, Users, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
const HeroContent = () => {
  return <div className="text-center lg:text-left space-y-8 animate-fade-in">
      {/* Trust Badge */}
      
      
      {/* Main Headline */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
        <span className="text-foreground">
          Find Your MS<span className="text-blue-600">Twin</span>
        </span>
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
          <span className="text-sm text-muted-foreground">500+ members</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">1,000 matches made</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-accent" fill="currentColor" />
          <span className="text-sm text-muted-foreground">4.9/5 member satisfaction</span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
        <Button variant="hero" size="lg" className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white relative overflow-hidden before:absolute before:inset-[-2px] before:rounded-lg before:bg-gradient-to-r before:from-transparent before:via-blue-400 before:to-transparent before:opacity-80 before:animate-[move-glow_3s_linear_infinite] before:-z-10" asChild>
          <Link to="/auth">
            Join Free Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-2 border-primary text-primary hover:bg-primary hover:text-white" asChild>
          <a href="#testimonials">
            See Success Stories
          </a>
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
    </div>;
};
export default HeroContent;