import { Heart, Users } from "lucide-react";

const MatchingAnimation = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex justify-center items-center space-x-8">
          {/* Person 1 */}
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-800">Sarah</h3>
              <p className="text-sm text-gray-600">RRMS • Chicago</p>
            </div>
          </div>

          {/* Matching Animation */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-ping"></div>
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
            </div>
            
            <div className="bg-gradient-to-r from-pink-400 to-red-400 rounded-full p-3 animate-scale-in">
              <Heart className="w-8 h-8 text-white animate-pulse" />
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-ping"></div>
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>

          {/* Person 2 */}
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-bounce" style={{ animationDelay: '0.3s' }}>
              <Users className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-800">Alex</h3>
              <p className="text-sm text-gray-600">PPMS • Chicago</p>
            </div>
          </div>
        </div>

        {/* Match Message */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-red-100 rounded-full px-6 py-3 animate-fade-in">
            <Heart className="w-5 h-5 text-pink-600" />
            <span className="text-pink-600 font-medium">It's a Match! 🎉</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MatchingAnimation;