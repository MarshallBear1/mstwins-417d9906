import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Calendar } from "lucide-react";
const MatchingAnimation = () => {
  const sarahProfile = {
    id: "1",
    first_name: "Sarah",
    last_name: "Johnson",
    date_of_birth: "1990-03-15",
    location: "Chicago, IL",
    ms_subtype: "RRMS",
    diagnosis_year: 2018,
    symptoms: ["Fatigue", "Muscle weakness"],
    medications: ["Tecfidera", "Vitamin D"],
    hobbies: ["Reading", "Yoga", "Cooking"],
    avatar_url: "https://api.dicebear.com/6.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile",
    about_me: "Love connecting with others who understand the MS journey. Always looking for new friends!"
  };
  const alexProfile = {
    id: "2",
    first_name: "Alex",
    last_name: "Chen",
    date_of_birth: "1985-07-22",
    location: "Chicago, IL",
    ms_subtype: "PPMS",
    diagnosis_year: 2015,
    symptoms: ["Balance issues", "Cognitive fog"],
    medications: ["Ocrevus", "Baclofen"],
    hobbies: ["Photography", "Chess", "Hiking"],
    avatar_url: "https://api.dicebear.com/6.x/avataaars/svg?seed=Alex&backgroundColor=c0aede,d1c4e9&eyes=happy&mouth=smile",
    about_me: "Photographer and chess enthusiast. Would love to meet others with similar interests!"
  };
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birth.getDate()) {
      return age - 1;
    }
    return age;
  };
  const ProfileCard = ({
    profile
  }: {
    profile: typeof sarahProfile;
  }) => <Card className="w-full max-w-sm mx-auto overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Header with gradient background */}
      <div className="relative h-32 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
          <img src={profile.avatar_url} alt={profile.first_name} className="w-full h-full object-cover" />
          {/* Online status indicator */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white bg-green-500" />
        </div>
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
          <span className="text-muted-foreground">{profile.ms_subtype.toUpperCase()}</span>
        </div>

        {/* Medications */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Medications</h4>
          <div className="flex flex-wrap gap-2">
            {profile.medications.map((medication, index) => <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs">
                {medication}
              </Badge>)}
          </div>
        </div>

        {/* Interests */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Interests</h4>
          <div className="flex flex-wrap gap-2">
            {profile.hobbies.slice(0, 3).map((hobby, index) => <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs">
                {hobby}
              </Badge>)}
          </div>
        </div>

        {/* About */}
        <div>
          <h4 className="text-sm font-semibold mb-2">About</h4>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {profile.about_me}
          </p>
        </div>
      </CardContent>
    </Card>;
  return;
};
export default MatchingAnimation;