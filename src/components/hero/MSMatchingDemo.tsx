import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, MapPin, Calendar, X, Check, ArrowRight } from "lucide-react";
import { useState, useEffect, memo } from "react";
import { Link } from "react-router-dom";

const MSMatchingDemo = memo(() => {
  const [step, setStep] = useState(0);
  const [showConversation, setShowConversation] = useState(false);
  
  const profiles = [
    {
      id: 1,
      name: "Sarah",
      age: 28,
      location: "Chicago, IL",
      diagnosedYear: 2020,
      msType: "RRMS",
      interests: ["Photography", "Yoga"],
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4&eyes=happy&mouth=smile"
    },
    {
      id: 2,
      name: "You",
      age: 32,
      location: "Chicago, IL", 
      diagnosedYear: 2019,
      msType: "RRMS",
      interests: ["Reading", "Coffee"],
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=You&backgroundColor=c0aede&eyes=happy&mouth=smile"
    }
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 2000);
    const timer2 = setTimeout(() => setStep(2), 4000);
    const timer3 = setTimeout(() => setShowConversation(true), 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="relative max-w-lg mx-auto animate-fade-in">
      {/* Profile Matching Animation */}
      <div className="relative h-80 flex items-center justify-center">
        {/* Left Profile (You) */}
        <div className={`absolute transition-all duration-1000 ${
          step >= 1 ? 'translate-x-[-180px] sm:translate-x-[-200px]' : 'translate-x-0'
        }`}>
          <ProfileCard profile={profiles[1]} isYou={true} />
        </div>

        {/* Right Profile (Sarah) */}
        <div className={`absolute transition-all duration-1000 ${
          step >= 1 ? 'translate-x-[180px] sm:translate-x-[200px] opacity-100' : 'translate-x-[200px] opacity-0'
        }`}>
          <ProfileCard profile={profiles[0]} />
        </div>

        {/* Robot Match Animation */}
        {step >= 2 && (
          <div className="absolute z-10 animate-scale-in">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-100 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                  alt="MSTwins robot"
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain animate-pulse"
                  style={{ 
                    animation: 'gentle-float 3s ease-in-out infinite',
                    animationDelay: '0.5s'
                  }}
                />
              </div>
              {/* Speech Bubble */}
              <div className="absolute -top-18 sm:-top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium text-center min-w-max">
                <div>🎉 You've been matched!</div>
                <div>Start connecting</div>
                <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-blue-600"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conversation Demo */}
      {showConversation && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6 space-y-4 animate-slide-in-right">
          <div className="flex items-center gap-3 pb-3 border-b">
            <img 
              src={profiles[0].avatar} 
              alt="Sarah"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h4 className="font-semibold text-gray-900">Sarah</h4>
              <span className="text-sm text-green-600 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Online
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-2 max-w-xs">
                <p className="text-sm text-gray-800">Hi! So excited to connect with you! 😊</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <div className="bg-blue-600 rounded-2xl px-4 py-2 max-w-xs">
                <p className="text-sm text-white">Hey Sarah! Nice to meet you!</p>
              </div>
            </div>
            
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs">
                <p className="text-sm text-gray-800">
                  I see we both live in Chicago! 🏙️ Do you know any good MS support groups here?
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <div className="bg-blue-600 rounded-2xl px-4 py-2 max-w-xs">
                <p className="text-sm text-white">Yes! I'd love to share some recommendations ☕</p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Call to Action */}
      {showConversation && (
        <div className="text-center mt-8 animate-fade-in">
          <Button 
            variant="hero" 
            size="lg" 
            className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white shadow-medium hover:shadow-strong transform hover:scale-105 transition-all duration-300"
            asChild
          >
            <Link to="/auth">
              Start Connecting Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      )}

      {/* Status Text */}
      <div className="text-center mt-6">
        {step === 0 && (
          <p className="text-sm text-muted-foreground">Finding your perfect MS<span className="text-blue-600">Twin</span>...</p>
        )}
        {step === 1 && (
          <p className="text-sm text-muted-foreground">Analyzing compatibility...</p>
        )}
        {step === 2 && !showConversation && (
          <p className="text-sm text-success font-semibold">It's a match! 💫</p>
        )}
      </div>
    </div>
  );
});

const ProfileCard = ({ profile, isYou = false }: { profile: any; isYou?: boolean }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-36 sm:w-40 hover:shadow-xl transition-shadow">
      {/* Avatar */}
      <div className="relative h-24 bg-gradient-to-br from-blue-400 to-teal-300 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white">
          <img 
            src={profile.avatar} 
            alt={profile.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        {isYou && (
          <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
            You
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="text-center">
          <h3 className="font-semibold text-gray-900 text-base">{profile.name}</h3>
          <span className="text-sm text-gray-600">{profile.age}</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1 text-gray-600">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs truncate">{profile.location}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs">{profile.diagnosedYear}</span>
          </div>
        </div>

        <div className="text-center">
          <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-1">
            {profile.msType}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1 justify-center">
          {profile.interests.slice(0, 2).map((interest: string, index: number) => (
            <span 
              key={index}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

MSMatchingDemo.displayName = 'MSMatchingDemo';

export default MSMatchingDemo;