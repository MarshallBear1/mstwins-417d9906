import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowRight, Star, Users, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
const HeroContent = () => {
  return (
    <div className="text-center lg:text-left space-y-8 animate-fade-in">
      {/* Clean Trust Badge */}
      <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
          <span className="text-sm font-semibold text-blue-700">🏆 #1 MS Support Community</span>
        </div>
      </div>
      
      {/* Clean Headline */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
        <span className="text-gray-900">
          Find Your MS
        </span>
        <br />
        <span className="text-blue-600">
          Support Twin
        </span>
      </h1>
      
      {/* Modern Subtitle */}
      <p className="text-xl md:text-2xl text-gray-600 max-w-xl leading-relaxed">
        Connect with others who truly understand your 
        <span className="font-semibold text-gray-800"> Multiple Sclerosis journey</span>. 
        Build meaningful friendships in our safe community.
      </p>

      {/* Clean Social Proof */}
      <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">500+</div>
            <div className="text-sm text-gray-600">Members</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
          <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">1,000</div>
            <div className="text-sm text-gray-600">Connections</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">4.9</div>
            <div className="text-sm text-gray-600">Rating</div>
          </div>
        </div>
      </div>

      {/* Clean CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
        <Button 
          size="lg" 
          className="h-14 px-8 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300" 
          asChild
        >
          <Link to="/auth">
            <div className="flex items-center gap-3">
              Join Free Today
              <ArrowRight className="w-5 h-5" />
            </div>
          </Link>
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          className="h-14 px-8 text-lg font-semibold border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 rounded-2xl transition-all duration-300" 
          asChild
        >
          <a href="#testimonials">
            Success Stories
          </a>
        </Button>
      </div>

      {/* Clean Trust Indicators */}
      <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-600">100% Free Forever</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-600">Safe & Private</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-600">Join in 60 Seconds</span>
        </div>
      </div>
    </div>
  );
};
export default HeroContent;