import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Calendar } from "lucide-react";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  location: string;
  ms_subtype: string | null;
  diagnosis_year: number | null;
  symptoms: string[];
  medications: string[];
  hobbies: string[];
  avatar_url: string | null;
  about_me: string | null;
  last_seen: string | null;
}

interface DiscoverProfileCardProps {
  profile: Profile;
}

const DiscoverProfileCard = ({ profile }: DiscoverProfileCardProps) => {
  const { isUserOnline, getLastSeenText } = useRealtimePresence();

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  return (
    <Card className="w-full max-w-sm mx-auto overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Header with gradient background */}
      <div className="relative h-32 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.first_name}
              className="w-full h-full object-cover"
              loading="lazy"
              onLoad={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${profile.first_name}&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile`;
              }}
              style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          {/* Online status indicator */}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${
            isUserOnline(profile.user_id) ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Name, Age, and Online Status */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold">{profile.first_name} {profile.last_name}</h3>
          <div className="flex items-center gap-2">
            {profile.date_of_birth && (
              <span className="text-lg font-semibold text-muted-foreground">
                {calculateAge(profile.date_of_birth)}
              </span>
            )}
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isUserOnline(profile.user_id) ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs text-muted-foreground">
                {isUserOnline(profile.user_id) ? 'Online' : getLastSeenText(profile.last_seen)}
              </span>
            </div>
          </div>
        </div>

        {/* Location and Diagnosis */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{profile.location}</span>
          </div>
          {profile.diagnosis_year && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Diagnosed in {profile.diagnosis_year}</span>
            </div>
          )}
        </div>

        {/* MS Type */}
        {profile.ms_subtype && (
          <div>
            <h4 className="text-sm font-semibold mb-2">MS Type</h4>
            <span className="text-muted-foreground">{profile.ms_subtype.toUpperCase()}</span>
          </div>
        )}

        {/* Medications */}
        {profile.medications.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Medications</h4>
            <div className="flex flex-wrap gap-2">
              {profile.medications.slice(0, 4).map((medication, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs"
                >
                  {medication}
                </Badge>
              ))}
              {profile.medications.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{profile.medications.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Interests */}
        {profile.hobbies.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {profile.hobbies.slice(0, 6).map((hobby, index) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs"
                >
                  {hobby}
                </Badge>
              ))}
              {profile.hobbies.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{profile.hobbies.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* About */}
        {profile.about_me && (
          <div>
            <h4 className="text-sm font-semibold mb-2">About</h4>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {profile.about_me}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscoverProfileCard;