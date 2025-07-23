import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, ArrowLeftRight, Heart, MessageCircle } from "lucide-react";

interface FeaturedProfile {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  location: string;
  ms_subtype: string;
  diagnosis_year: number;
  symptoms: string[];
  medications: string[];
  hobbies: string[];
  avatar_url: string;
  about_me: string;
  selected_prompts: {
    question: string;
    answer: string;
  }[];
}

const FeaturedProfiles = () => {
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});
  
  const featuredProfiles: FeaturedProfile[] = [
    {
      id: "1",
      first_name: "Sarah",
      last_name: "Johnson",
      date_of_birth: "1990-03-15",
      location: "New York, NY",
      ms_subtype: "RRMS",
      diagnosis_year: 2018,
      symptoms: ["Fatigue", "Muscle weakness", "Balance issues"],
      medications: ["Tecfidera", "Vitamin D"],
      hobbies: ["Reading", "Yoga", "Cooking"],
      avatar_url: "https://api.dicebear.com/6.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile",
      about_me: "Love connecting with others who understand the MS journey. Always looking for new friends!",
      selected_prompts: [
        {
          question: "What's your favorite way to manage MS fatigue?",
          answer: "I've found that yoga and meditation really help me manage fatigue. Short 15-minute sessions make a huge difference in my energy levels."
        },
        {
          question: "What hobby has brought you the most joy?",
          answer: "Cooking has been my creative outlet! I love experimenting with anti-inflammatory recipes that make me feel good."
        }
      ]
    },
    {
      id: "2",
      first_name: "Alex",
      last_name: "Chen",
      date_of_birth: "1985-07-22",
      location: "New York, NY",
      ms_subtype: "PPMS",
      diagnosis_year: 2015,
      symptoms: ["Balance issues", "Cognitive fog", "Spasticity"],
      medications: ["Ocrevus", "Baclofen"],
      hobbies: ["Photography", "Chess", "Hiking"],
      avatar_url: "https://api.dicebear.com/6.x/avataaars/svg?seed=Alex&backgroundColor=c0aede,d1c4e9&eyes=happy&mouth=smile",
      about_me: "Photographer and chess enthusiast. Would love to meet others with similar interests!",
      selected_prompts: [
        {
          question: "How do you stay mentally sharp with brain fog?",
          answer: "Chess has been amazing for keeping my mind active! I also use brain training apps and try to read for at least 30 minutes daily."
        },
        {
          question: "What's your most inspiring MS moment?",
          answer: "When I captured an amazing sunrise photo despite having a difficult MS day - it reminded me that beauty is always there if we look for it."
        }
      ]
    }
  ];

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const toggleFlip = (profileId: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [profileId]: !prev[profileId]
    }));
  };

  const ProfileCard = ({ profile }: { profile: FeaturedProfile }) => {
    const isFlipped = flippedCards[profile.id];

    return (
      <div className="relative h-[500px] w-full" style={{ perspective: '1000px' }}>
        <div 
          className={`relative w-full h-full transition-transform duration-700 preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front of card */}
          <Card className="absolute inset-0 w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 backface-hidden">
            {/* Header with gradient background */}
            <div className="relative h-32 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img src={profile.avatar_url} alt={profile.first_name} className="w-full h-full object-cover" />
                {/* Online status indicator */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white bg-green-500" />
              </div>
              
              {/* Flip button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-white hover:bg-white/20 p-2"
                onClick={() => toggleFlip(profile.id)}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </Button>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Name, Age, and Online Status */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold">{profile.first_name} {profile.last_name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-muted-foreground">
                    {calculateAge(profile.date_of_birth)}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
              </div>

              {/* Location and Diagnosis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profile.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Diagnosed in {profile.diagnosis_year}</span>
                </div>
              </div>

              {/* MS Type */}
              <div>
                <h4 className="text-sm font-semibold mb-2">MS Type</h4>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  {profile.ms_subtype}
                </Badge>
              </div>

              {/* Interests */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.slice(0, 3).map((hobby, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs">
                      {hobby}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* About */}
              <div>
                <h4 className="text-sm font-semibold mb-2">About</h4>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {profile.about_me}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Heart className="w-4 h-4 mr-2" />
                  Connect
                </Button>
                <Button size="sm" className="flex-1">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Back of card */}
          <Card className="absolute inset-0 w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 backface-hidden rotate-y-180">
            <div className="relative h-32 bg-gradient-to-br from-purple-400 via-purple-300 to-pink-300 flex items-center justify-center">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img src={profile.avatar_url} alt={profile.first_name} className="w-full h-full object-cover" />
              </div>
              
              {/* Flip button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-white hover:bg-white/20 p-2"
                onClick={() => toggleFlip(profile.id)}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </Button>
            </div>

            <CardContent className="p-4 space-y-4 h-[calc(100%-8rem)] overflow-y-auto">
              <div className="text-center">
                <h3 className="text-xl font-bold">{profile.first_name} {profile.last_name}</h3>
                <p className="text-sm text-muted-foreground">More about me</p>
              </div>

              {/* Symptoms */}
              <div>
                <h4 className="text-sm font-semibold mb-2">My Symptoms</h4>
                <div className="flex flex-wrap gap-1">
                  {profile.symptoms.map((symptom, index) => (
                    <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Medications */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Current Medications</h4>
                <div className="flex flex-wrap gap-1">
                  {profile.medications.map((medication, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      {medication}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Prompts */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Get to Know Me</h4>
                <div className="space-y-3">
                  {profile.selected_prompts.map((prompt, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">{prompt.question}</p>
                      <p className="text-xs text-gray-600">{prompt.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {featuredProfiles.map((profile) => (
        <ProfileCard key={profile.id} profile={profile} />
      ))}
    </div>
  );
};

export default FeaturedProfiles;