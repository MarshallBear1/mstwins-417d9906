import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, Calendar, Heart, X, Pill, Activity, BookOpen } from "lucide-react";
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

interface ProfileViewDialogProps {
  profile: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLike?: () => void;
  onPass?: () => void;
  showActions?: boolean;
  isLiking?: boolean;
}

const ProfileViewDialog = ({ 
  profile, 
  open, 
  onOpenChange, 
  onLike, 
  onPass, 
  showActions = false,
  isLiking = false 
}: ProfileViewDialogProps) => {
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

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {profile.first_name} {profile.last_name}'s Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with Avatar */}
          <div className="relative h-40 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 rounded-lg flex items-center justify-center -mt-6 -mx-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
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
            
            {/* Online status badge */}
            <div className="absolute top-4 right-4 bg-white/90 rounded-full px-3 py-1">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  isUserOnline(profile.user_id) ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-xs font-medium">
                  {isUserOnline(profile.user_id) ? 'Online' : getLastSeenText(profile.last_seen)}
                </span>
              </div>
            </div>
          </div>

          {/* Name and Age */}
          <div className="text-center">
            <h2 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h2>
            {profile.date_of_birth && (
              <p className="text-lg text-muted-foreground">
                {calculateAge(profile.date_of_birth)} years old
              </p>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </div>
            {profile.diagnosis_year && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Diagnosed in {profile.diagnosis_year}</span>
              </div>
            )}
          </div>

          {/* MS Type */}
          {profile.ms_subtype && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                MS Type
              </h3>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {profile.ms_subtype}
              </Badge>
            </div>
          )}

          {/* Symptoms */}
          {profile.symptoms.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Symptoms
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.symptoms.map((symptom, index) => (
                  <Badge 
                    key={index}
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200"
                  >
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Medications */}
          {profile.medications.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Medications
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.medications.map((medication, index) => (
                  <Badge 
                    key={index}
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    {medication}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {profile.hobbies.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.hobbies.map((hobby, index) => (
                  <Badge 
                    key={index}
                    variant="secondary"
                    className="bg-blue-100 text-blue-700"
                  >
                    {hobby}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          {profile.about_me && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground leading-relaxed">
                {profile.about_me}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onPass}
                className="flex-1 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                disabled={isLiking}
              >
                <X className="w-4 h-4 mr-2" />
                Pass
              </Button>
              <Button
                onClick={onLike}
                className="flex-1 bg-gradient-primary hover:opacity-90 text-white"
                disabled={isLiking}
              >
                <Heart className="w-4 h-4 mr-2" />
                {isLiking ? 'Liking...' : 'Like'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileViewDialog;