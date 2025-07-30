import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, Calendar, Heart, X, Pill, Activity, BookOpen, Flag, Eye, ArrowLeftRight } from "lucide-react";
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
  const [isFlipped, setIsFlipped] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showAllHobbies, setShowAllHobbies] = useState(false);
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);
  const [showAllMedications, setShowAllMedications] = useState(false);

  // Reset all expanded states when dialog opens/closes or profile changes
  React.useEffect(() => {
    if (!open) {
      setIsFlipped(false);
      setShowAllHobbies(false);
      setShowAllSymptoms(false);
      setShowAllMedications(false);
    }
  }, [open]);

  // Reset flip state when profile changes (for passing to next card)
  React.useEffect(() => {
    setIsFlipped(false);
  }, [profile?.id]);

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-[400px] max-w-[90vw] max-h-[90vh] overflow-hidden p-0 [&>button]:hidden"
          style={{ 
            perspective: '1000px',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            margin: 0
          }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>
              {profile.first_name} {profile.last_name}'s Profile
            </DialogTitle>
          </DialogHeader>
          
          <div 
            className="relative w-full transition-transform duration-700"
            style={{ 
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* Front Side - Original Card */}
            <div 
              className="relative bg-white rounded-xl shadow-xl overflow-hidden w-[400px] max-w-[90vw] mx-auto max-h-[90vh] overflow-y-auto"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)'
              }}
            >
              {/* Header Image Section */}
              <div className="relative h-48 bg-gradient-to-br from-blue-400/20 via-purple-300/20 to-pink-300/20 overflow-hidden">
                {/* Main Avatar */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={`${profile.first_name}'s profile`}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-xl cursor-pointer hover:scale-105 transition-transform duration-300"
                      onClick={() => setShowImageViewer(true)}
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${profile.first_name}&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile`;
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-4 border-white shadow-xl">
                      <User className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Online Status Indicator */}
                  <div className={`absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 border-white shadow-lg ${
                    isUserOnline(profile.user_id) ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>

                {/* Close Button */}
                <button
                  onClick={() => onOpenChange(false)}
                  className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                  aria-label="Close profile"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>

                {/* Online Status Badge */}
                <div className="absolute top-4 left-4 bg-white/90 rounded-full px-3 py-1 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isUserOnline(profile.user_id) ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-xs font-medium">
                      {isUserOnline(profile.user_id) ? 'Online' : getLastSeenText(profile.last_seen)}
                    </span>
                  </div>
                </div>

                {/* Flip Button */}
                {hasExtendedContent && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsFlipped(!isFlipped);
                    }}
                    className="absolute bottom-4 left-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10"
                    aria-label="Flip card"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-gray-700" />
                  </button>
                )}

                {/* Additional Photos Indicator */}
                {profile.additional_photos && profile.additional_photos.length > 0 && (
                  <div className="absolute bottom-4 right-4 bg-white/90 rounded-full px-3 py-1 shadow-lg">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span className="text-xs font-medium">+{profile.additional_photos.length} photos</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Info Section */}
              <div className="p-3 space-y-3 overflow-y-auto">
                {/* Name and Age */}
                <div className="text-center">
                  <h2 className="text-lg font-bold text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  {profile.date_of_birth && (
                    <p className="text-sm text-gray-600">
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
                      {profile.ms_subtype.toUpperCase()}
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
                      {(showAllHobbies ? profile.hobbies : profile.hobbies.slice(0, 6)).map((hobby, index) => (
                        <Badge 
                          key={index}
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 text-xs"
                        >
                          {hobby}
                        </Badge>
                      ))}
                      {profile.hobbies.length > 6 && (
                        <button
                          onClick={() => setShowAllHobbies(!showAllHobbies)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          {showAllHobbies ? 'Show less' : `and ${profile.hobbies.length - 6} more`}
                        </button>
                      )}
                    </div>
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

            {/* Back Side - Extended Content */}
            <div 
              className="absolute inset-0 bg-white rounded-xl shadow-xl overflow-hidden w-[400px] max-w-[90vw] mx-auto max-h-[90vh]"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div className="h-full overflow-y-auto overscroll-contain">
                {/* Header */}
                <div className="relative bg-gradient-to-br from-purple-400/20 via-pink-300/20 to-orange-300/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">More About {profile.first_name}</h3>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsFlipped(false);
                      }}
                      className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 z-10"
                      aria-label="Flip back"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-6">
                  {/* Additional Photos */}
                  {profile.additional_photos && profile.additional_photos.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Photos ({profile.additional_photos.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {profile.additional_photos.map((photo, index) => (
                          <div
                            key={index}
                            className="aspect-square rounded-lg overflow-hidden border-2 border-gray-100 cursor-pointer hover:border-blue-300 transition-colors group"
                            onClick={() => setShowImageViewer(true)}
                          >
                            <img
                              src={photo}
                              alt={`Additional photo ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Health Information */}
                  {(profile.symptoms.length > 0 || profile.medications.length > 0) && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Health Information
                      </h4>
                      
                      {/* Symptoms */}
                      {profile.symptoms.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Symptoms</h5>
                          <div className="flex flex-wrap gap-2">
                            {(showAllSymptoms ? profile.symptoms : profile.symptoms.slice(0, 6)).map((symptom, index) => (
                              <Badge 
                                key={index}
                                variant="outline"
                                className="bg-orange-50 text-orange-700 border-orange-200 text-xs"
                              >
                                {symptom}
                              </Badge>
                            ))}
                            {profile.symptoms.length > 6 && (
                              <button
                                onClick={() => setShowAllSymptoms(!showAllSymptoms)}
                                className="text-xs text-orange-600 hover:text-orange-800 underline"
                              >
                                {showAllSymptoms ? 'Show less' : `and ${profile.symptoms.length - 6} more`}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Medications */}
                      {profile.medications.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Medications</h5>
                          <div className="flex flex-wrap gap-2">
                            {(showAllMedications ? profile.medications : profile.medications.slice(0, 6)).map((medication, index) => (
                              <Badge 
                                key={index}
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200 text-xs"
                              >
                                {medication}
                              </Badge>
                            ))}
                            {profile.medications.length > 6 && (
                              <button
                                onClick={() => setShowAllMedications(!showAllMedications)}
                                className="text-xs text-green-600 hover:text-green-800 underline"
                              >
                                {showAllMedications ? 'Show less' : `and ${profile.medications.length - 6} more`}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Personal Stories */}
                  {profile.selected_prompts && profile.selected_prompts.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Personal Stories
                      </h4>
                      <div className="space-y-3">
                        {profile.selected_prompts.map((prompt, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                              {prompt.question}
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {prompt.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons on Back Side */}
                  {showActions && (
                    <div className="pt-4 space-y-3 border-t border-gray-200">
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Flip to front first if we're on the back side
                            if (isFlipped) {
                              setIsFlipped(false);
                              // Small delay to let the flip animation complete before executing pass
                              setTimeout(() => {
                                onPass?.();
                              }, 350); // Slightly longer than the 300ms animation
                            } else {
                              onPass?.();
                            }
                          }}
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Image Viewer */}
      {showImageViewer && (
        <ProfileImageViewer
          images={[profile.avatar_url, ...(profile.additional_photos || [])].filter(Boolean) as string[]}
          currentIndex={0}
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </>
  );
};

export default ProfileViewDialog;