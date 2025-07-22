import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowRight, MapPin, Calendar, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LaunchStats from "@/components/LaunchStats";

const Hero = () => {
  const [currentProfile, setCurrentProfile] = useState(0);
  
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
    <section className="relative min-h-screen flex items-center bg-gradient-subtle pt-16">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Heart className="w-4 h-4" fill="currentColor" />
                MS community
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                Connecting the MS{" "}
                <span className="block">Community</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
                Find meaningful connections, share experiences, and build lasting friendships with others who understand your journey with Multiple Sclerosis.
              </p>
            </div>

            <Button 
              variant="hero" 
              size="lg" 
              className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white" 
              asChild
            >
              <Link to="/auth">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Demo Profile Card */}
          <div className="relative animate-scale-in">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto">
              {/* Avatar Section with Gradient Background */}
              <div className="relative h-48 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img 
                    src={profile.avatar} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Decorative hearts */}
                <div className="absolute top-6 right-6 text-white/30">
                  <Heart className="w-6 h-6" fill="currentColor" />
                </div>
                <div className="absolute bottom-8 left-8 text-white/20">
                  <Heart className="w-4 h-4" fill="currentColor" />
                </div>
              </div>

              {/* Profile Content */}
              <div className="p-6 space-y-4">
                {/* Name and Age */}
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">{profile.name}</h3>
                  <span className="text-xl font-semibold text-gray-600">{profile.age}</span>
                </div>

                {/* Location and Diagnosis */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Diagnosed in {profile.diagnosedYear}</span>
                  </div>
                </div>

                {/* MS Type */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">MS Type</h4>
                  <span className="text-gray-700">{profile.msType}</span>
                </div>

                {/* Interests */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <Badge 
                        key={index}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* About */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">About</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {profile.about}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Pass
                  </Button>
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Heart className="w-4 h-4 mr-2" fill="currentColor" />
                    Like
                  </Button>
                </div>
              </div>
            </div>

            {/* Profile Indicator Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {demoProfiles.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentProfile(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentProfile 
                      ? 'bg-blue-600 w-6' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Launch Stats Section */}
        <div className="mt-16">
          <LaunchStats />
        </div>
      </div>
    </section>
  );
};

export default Hero;