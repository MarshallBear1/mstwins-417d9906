import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, Calendar, Heart, X, Pill, Activity, BookOpen, Flag, Eye } from "lucide-react";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import UserReportDialog from "@/components/UserReportDialog";
import ProfileImageViewer from "@/components/ProfileImageViewer";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  location: string;
  gender: string | null;
  ms_subtype: string | null;
  diagnosis_year: number | null;
  symptoms: string[];
  medications: string[];
  hobbies: string[];
  avatar_url: string | null;
  about_me: string | null;
  last_seen: string | null;
  additional_photos?: string[];
  selected_prompts?: {
    question: string;
    answer: string;
  }[];
  extended_profile_completed?: boolean;
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

  const hasExtendedContent = profile.additional_photos?.length || 
                           profile.selected_prompts?.length || 
                           profile.medications?.length || 
                           profile.symptoms?.length;

  const isOnline = isUserOnline(profile.user_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-w-[95vw] max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {profile.first_name} {profile.last_name}'s Profile
          </DialogTitle>
        </DialogHeader>
        
        {/* Enhanced Profile Card - Similar to Discover Section */}
        <div className="relative bg-white rounded-xl shadow-xl overflow-hidden max-w-md mx-auto">
          {/* Header Image Section */}
          <div className="relative h-80 bg-gradient-to-br from-blue-400/20 via-purple-300/20 to-pink-300/20 overflow-hidden">
            {/* Main Avatar */}
            <div className="absolute inset-0 flex items-center justify-center">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={`${profile.first_name}'s profile`}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => profile.avatar_url && window.open(profile.avatar_url, '_blank')}
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${profile.first_name}&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile`;
                  }}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-white shadow-xl">
                  <User className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              
              {/* Online Status Indicator */}
              <div className={`absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 border-white shadow-lg ${
                isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>

            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
              aria-label="Close profile"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            {/* Online Status Badge */}
            <div className="absolute top-4 left-4 bg-white/90 rounded-full px-3 py-1 shadow-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs font-medium">
                  {isOnline ? 'Online' : getLastSeenText(profile.last_seen)}
                </span>
              </div>
            </div>

            {/* Additional Photos Indicator */}
            {profile.additional_photos && profile.additional_photos.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-white/90 rounded-full px-3 py-1 shadow-lg">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs font-medium">+{profile.additional_photos.length} photos</span>
                </div>
              </div>
            )}
          </div>

          {/* Profile Info Section */}
          <div className="p-4 space-y-4">
            {/* Name and Age */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.first_name} {profile.last_name}
              </h2>
              {profile.date_of_birth && (
                <p className="text-lg text-gray-600">
                  {calculateAge(profile.date_of_birth)} years old
                </p>
              )}
            </div>

            {/* Basic Info Row */}
            <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
              {profile.gender && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}</span>
                </div>
              )}
              {profile.diagnosis_year && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Diagnosed {profile.diagnosis_year}</span>
                </div>
              )}
            </div>

            {/* MS Type */}
            {profile.ms_subtype && (
              <div className="text-center">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-sm px-3 py-1">
                  {profile.ms_subtype}
                </Badge>
              </div>
            )}

            {/* About Me */}
            {profile.about_me && (
              <div className="text-center">
                <p className="text-gray-600 leading-relaxed text-sm">
                  {profile.about_me}
                </p>
              </div>
            )}

            {/* Interests */}
            {profile.hobbies.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-center">Interests</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {profile.hobbies.slice(0, 6).map((hobby, index) => (
                    <Badge 
                      key={index}
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 text-xs"
                    >
                      {hobby}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Extended Content Preview */}
            {hasExtendedContent && (
              <div className="space-y-3">
                {/* Symptoms Preview */}
                {profile.symptoms.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
                      <Activity className="w-4 h-4" />
                      Symptoms
                    </h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {profile.symptoms.slice(0, 4).map((symptom, index) => (
                        <Badge 
                          key={index}
                          variant="outline"
                          className="bg-orange-50 text-orange-700 border-orange-200 text-xs"
                        >
                          {symptom}
                        </Badge>
                      ))}
                      {profile.symptoms.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.symptoms.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Medications Preview */}
                {profile.medications.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
                      <Pill className="w-4 h-4" />
                      Medications
                    </h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {profile.medications.slice(0, 3).map((medication, index) => (
                        <Badge 
                          key={index}
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 text-xs"
                        >
                          {medication}
                        </Badge>
                      ))}
                      {profile.medications.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.medications.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Photos Grid */}
                {profile.additional_photos && profile.additional_photos.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-center">More Photos</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {profile.additional_photos.slice(0, 6).map((photo, index) => (
                        <div
                          key={index}
                          className="aspect-square rounded-lg overflow-hidden border-2 border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
                          onClick={() => window.open(photo, '_blank')}
                        >
                          <img
                            src={photo}
                            alt={`Additional photo ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personal Stories Preview */}
                {profile.selected_prompts && profile.selected_prompts.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-center">Personal Stories</h3>
                    <div className="space-y-2">
                      {profile.selected_prompts.slice(0, 2).map((prompt, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            {prompt.question}
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {prompt.answer.length > 100 
                              ? `${prompt.answer.slice(0, 100)}...` 
                              : prompt.answer
                            }
                          </p>
                        </div>
                      ))}
                      {profile.selected_prompts.length > 2 && (
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">
                            +{profile.selected_prompts.length - 2} more stories
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {showActions && (
              <div className="pt-4 space-y-3">
                <div className="flex gap-3">
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
                
                {/* Report User Button */}
                <UserReportDialog 
                  profile={profile}
                  trigger={
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-muted-foreground hover:text-destructive"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Report User
                    </Button>
                  }
                />
              </div>
            )}
            
            {/* Report Button for non-action views */}
            {!showActions && (
              <div className="pt-4 border-t border-gray-200">
                <UserReportDialog 
                  profile={profile}
                  trigger={
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Report User
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileViewDialog;