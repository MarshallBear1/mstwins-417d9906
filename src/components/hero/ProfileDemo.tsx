
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, MapPin, Calendar, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";

const ProfileDemo = () => {
  const [currentProfile, setCurrentProfile] = useState(0);
  const [showFullAbout, setShowFullAbout] = useState(false);
  
  const demoProfiles = [
    {
      id: 1,
      name: "Sarah",
      age: 28,
      location: "Portland, OR",
      diagnosedYear: 2020,
      msType: "RRMS",
      interests: ["Photography", "Art", "Yoga", "Travel"],
      about: "Photographer and artist living with RRMS. I believe in finding beauty in every day and connecting with others who understand the journey.",
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile"
    },
    {
      id: 2,
      name: "Michael",
      age: 34,
      location: "Austin, TX",
      diagnosedYear: 2018,
      msType: "PPMS",
      interests: ["Music", "Cooking", "Reading", "Gaming"],
      about: "Music teacher and chef who loves sharing recipes and playlists. Always looking for new ways to stay creative and connected.",
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Michael&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile"
    },
    {
      id: 3,
      name: "Emma",
      age: 25,
      location: "Denver, CO",
      diagnosedYear: 2022,
      msType: "CIS",
      interests: ["Hiking", "Meditation", "Writing", "Volunteering"],
      about: "Recently diagnosed but staying positive. Love spending time outdoors and writing about my experiences to help others.",
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Emma&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProfile((prev) => (prev + 1) % demoProfiles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const profile = demoProfiles[currentProfile];

  return (
    <div className="relative animate-scale-in lg:scale-110">
      {/* Modern Profile Card */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm mx-auto border border-gray-100 transform hover:scale-105 transition-all duration-500">
        {/* Header with clean styling */}
        <div className="relative h-56 bg-blue-600 flex items-center justify-center overflow-hidden">
          {/* Clean background elements */}
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-6 left-6 w-12 h-12 bg-white/10 rounded-full blur-lg" />
          
          {/* Profile Image */}
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl z-10">
            <img 
              src={profile.avatar} 
              alt={profile.name}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-6 right-6 text-white/30">
            <Heart className="w-6 h-6" fill="currentColor" />
          </div>
          <div className="absolute bottom-8 left-8 text-white/20">
            <Heart className="w-4 h-4" fill="currentColor" />
          </div>
        </div>

        {/* Modern Profile Content */}
        <div className="p-6 space-y-5">
          {/* Name and Age */}
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">{profile.name}</h3>
            <span className="text-lg font-semibold text-gray-600">{profile.age}</span>
          </div>

          {/* Location and Diagnosis */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium">{profile.location}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <span className="font-medium">Diagnosed in {profile.diagnosedYear}</span>
            </div>
          </div>

          {/* MS Type Badge */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">MS Type</h4>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold px-3 py-1 rounded-full">
              {profile.msType}
            </Badge>
          </div>

          {/* Interests */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 3).map((interest, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors font-medium px-3 py-1 rounded-full"
                >
                  {interest}
                </Badge>
              ))}
              {profile.interests.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="bg-gray-50 border-gray-200 text-gray-500 font-medium px-3 py-1 rounded-full"
                >
                  +{profile.interests.length - 3}
                </Badge>
              )}
            </div>
          </div>

          {/* About Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">About</h4>
            <p className={`text-sm text-gray-600 leading-relaxed transition-all duration-300 ${
              showFullAbout ? '' : 'line-clamp-3'
            }`}>
              {profile.about}
            </p>
            <button
              onClick={() => setShowFullAbout(!showFullAbout)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2 flex items-center gap-1 transition-colors"
            >
              {showFullAbout ? (
                <>Show Less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show More <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          </div>

          {/* Modern Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 h-12 border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 font-semibold rounded-xl transition-all duration-200"
            >
              <X className="w-4 h-4 mr-2" />
              Pass
            </Button>
            <Button 
              className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Heart className="w-4 h-4 mr-2" fill="currentColor" />
              Connect
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {demoProfiles.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentProfile(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentProfile 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Demo Label */}
      <div className="text-center mt-4">
        <span className="text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
          Live Preview • Join to See Real Profiles
        </span>
      </div>
    </div>
  );
};

export default ProfileDemo;
