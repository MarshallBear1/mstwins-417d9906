import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowRight, Star, Users, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
const HeroContent = () => {
  return <div className="text-center space-y-8 animate-fade-in">
      {/* MSTwins Mascot with Speech Bubble */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-6">
          {/* Intro Bubble (desktop) */}
          <div className="bg-white rounded-3xl px-6 py-4 shadow-lg border-2 border-blue-100 relative mb-4 max-w-sm mx-auto">
            <p className="text-gray-800 font-medium text-base leading-relaxed">
              Welcome to MSTwins — a supportive MS community for friendship and understanding.
            </p>
          </div>
          
          {/* Mascot */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-blue-50 p-2 shadow-lg animate-bounce">
              <img 
                src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                alt="MSTwins mascot" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Three Key Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border-2 border-green-200">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-green-800 text-sm">No Dating</h3>
            <p className="text-green-600 text-xs mt-1">Pure friendship & support</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border-2 border-blue-200">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-blue-800 text-sm">Connect & Chat</h3>
            <p className="text-blue-600 text-xs mt-1">Meaningful conversations</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border-2 border-purple-200">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-purple-800 text-sm">Join 1000+ People</h3>
            <p className="text-purple-600 text-xs mt-1">In the newest MS app</p>
          </div>
        </div>
      </div>
      
      {/* Clean Headline */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
        <span className="text-gray-900">
          Find Your MS
        </span>
        <br />
        <span className="text-blue-600">
          Support Twin
        </span>
      </h1>

      {/* Clean Social Proof */}
      <div className="flex flex-wrap gap-6 justify-center">
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">1,000+</div>
            <div className="text-sm text-gray-600">Members</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
          <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">5,000</div>
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
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300" asChild>
          <Link to="/auth">
            <div className="flex items-center gap-3">
              Join Free Today
              <ArrowRight className="w-5 h-5" />
            </div>
          </Link>
        </Button>
        
        <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all duration-300" asChild>
          <a href="https://apps.apple.com/gb/app/mstwins/id6749207642" target="_blank" rel="noopener noreferrer">
            <div className="flex items-center gap-3">
              Download iOS App
              <ArrowRight className="w-5 h-5" />
            </div>
          </a>
        </Button>
        
        <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 rounded-2xl transition-all duration-300" asChild>
          <a href="#testimonials">
            Success Stories
          </a>
        </Button>
      </div>

      {/* Clean Trust Indicators */}
      <div className="flex flex-wrap gap-6 justify-center pt-6">
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
    </div>;
};
export default HeroContent;