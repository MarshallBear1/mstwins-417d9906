import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Calendar, Pill, Sparkles, PartyPopper } from "lucide-react";
import { useState, useEffect, memo } from "react";

const ConnectionsDemo = memo(() => {
  const [step, setStep] = useState(0);
  
  const profiles = [
    {
      id: 1,
      name: "Sarah",
      fullName: "Sarah Johnson",
      age: 35,
      status: "Online",
      location: "Chicago, IL",
      diagnosedYear: 2018,
      msType: "RRMS",
      medications: ["Tecfidera", "Vitamin D"],
      interests: ["Reading", "Yoga", "Cooking"],
      about: "Love connecting with others who understand the MS journey. Always looking for new friends!",
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4&eyes=happy&mouth=smile"
    },
    {
      id: 2,
      name: "Alex", 
      fullName: "Alex Chen",
      age: 40,
      status: "Online",
      location: "Chicago, IL",
      diagnosedYear: 2015,
      msType: "PPMS",
      medications: ["Ocrevus", "Baclofen"],
      interests: ["Photography", "Chess", "Hiking"],
      about: "Photographer and chess enthusiast. Would love to meet others with similar interests!",
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Alex&backgroundColor=c0aede&eyes=happy&mouth=smile"
    }
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 3000);
    const timer2 = setTimeout(() => setStep(2), 6000);
    const timer3 = setTimeout(() => {
      setStep(0);
    }, 12000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">See How Connections Happen</h2>
        <p className="text-gray-600">When you both like each other, a match is created and you can start chatting!</p>
      </div>

      {/* Profiles Side by Side */}
      <div className={`grid md:grid-cols-2 gap-8 transition-all duration-1000 ${
        step === 2 ? 'transform scale-95' : ''
      }`}>
        {profiles.map((profile, index) => (
          <ProfileCard key={profile.id} profile={profile} step={step} index={index} />
        ))}
      </div>

      {/* Match Celebration */}
      {step === 2 && (
        <div className="text-center mt-8 animate-scale-in">
          <div className="bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <PartyPopper className="w-6 h-6" />
              <h3 className="text-2xl font-bold">It's a Match!</h3>
              <PartyPopper className="w-6 h-6" />
            </div>
            <p className="text-lg">Now you can start chatting.</p>
          </div>
        </div>
      )}
    </div>
  );
});

const ProfileCard = ({ profile, step, index }: { profile: any; step: number; index: number }) => {
  const showHeart = step >= 1;
  const isMatched = step === 2;

  return (
    <div className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500 ${
      isMatched ? 'ring-4 ring-pink-400 ring-opacity-50' : ''
    }`}>
      {/* Like Animation */}
      {showHeart && (
        <div className="absolute top-4 right-4 z-10 animate-scale-in">
          <div className="bg-pink-500 rounded-full p-2">
            <Heart className="w-6 h-6 text-white" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="relative h-32 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
          <img 
            src={profile.avatar} 
            alt={profile.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        {index === 0 && (
          <div className="absolute top-4 left-4 text-white">
            <Sparkles className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="p-6 space-y-4">
        {/* Name and Status */}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
          <p className="text-gray-600">{profile.fullName}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-lg font-semibold text-gray-700">{profile.age}</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600">{profile.status}</span>
            </div>
          </div>
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
          <h4 className="text-sm font-semibold text-gray-900 mb-1">MS Type</h4>
          <Badge className="bg-blue-100 text-blue-700">
            {profile.msType}
          </Badge>
        </div>

        {/* Medications */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Medications</h4>
          <div className="space-y-1">
            {profile.medications.map((med: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Pill className="w-3 h-3 text-gray-400" />
                <span className="text-sm text-gray-600">{med}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Interests</h4>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest: string, index: number) => (
              <Badge 
                key={index}
                variant="outline"
                className="text-xs"
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
      </div>
    </div>
  );
};

ConnectionsDemo.displayName = 'ConnectionsDemo';

export default ConnectionsDemo;