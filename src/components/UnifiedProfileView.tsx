import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, User, Eye, X, HandHeart } from "lucide-react";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { OptimizedAvatar } from "@/components/PerformanceOptimizer";
import ProfileImageViewer from "@/components/ProfileImageViewer";

interface UnifiedProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name?: string;
  age?: number | null;
  city?: string;
  gender?: string | null;
  ms_subtype?: string | null;
  avatar_url: string | null;
  about_me_preview?: string | null;
  about_me?: string | null;
  hobbies?: string[];
  additional_photos?: string[];
  selected_prompts?: Array<{question: string; answer: string}>;
  extended_profile_completed?: boolean;
  last_seen?: string;
  location?: string;
  symptoms?: string[];
  medications?: string[];
  date_of_birth?: string | null;
}

interface UnifiedProfileViewProps {
  profile: UnifiedProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showActions?: boolean;
  onLike?: () => void;
  onPass?: () => void;
  isLiking?: boolean;
}

const UnifiedProfileView = ({ 
  profile, 
  open, 
  onOpenChange, 
  showActions = false,
  onLike,
  onPass,
  isLiking = false 
}: UnifiedProfileViewProps) => {
  const { isUserOnline, getLastSeenText } = useRealtimePresence();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [showAllHobbies, setShowAllHobbies] = useState(false);
  const [showAllAbout, setShowAllAbout] = useState(false);

  if (!profile) return null;

  const calculateAge = (age?: number | null, dateOfBirth?: string | null) => {
    if (age) return age;
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const calculatedAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return calculatedAge - 1;
    }
    return calculatedAge;
  };

  const displayAge = calculateAge(profile.age, profile.date_of_birth);
  const displayLocation = profile.city || (profile.location ? profile.location.split(',')[0] : '');
  const displayAbout = profile.about_me_preview || profile.about_me;

  // Prepare all images for the viewer
  const allImages = [
    ...(profile.avatar_url ? [profile.avatar_url] : []),
    ...(profile.additional_photos || [])
  ];

  const openImageViewer = (imageIndex: number) => {
    setImageViewerIndex(imageIndex);
    setShowImageViewer(true);
  };

  const hasExtendedContent = Boolean(
    (profile.additional_photos && profile.additional_photos.length > 0) ||
    (profile.selected_prompts && profile.selected_prompts.length > 0) ||
    (displayAbout && displayAbout.length > 80) ||
    profile.hobbies?.length ||
    profile.ms_subtype
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-0 max-w-[90vw] w-full max-h-[90vh] overflow-hidden sm:max-w-md border-0 bg-transparent shadow-none [&>button]:hidden">
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div 
                className="flip-card" 
                style={{ 
                  minHeight: '520px', 
                  width: '340px', 
                  perspective: '1000px',
                  position: 'relative'
                }}
              >
                <div className={`flip-card-inner ${isFlipped ? 'rotate-y-180' : ''}`} style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative'
                }}>
                  {/* Front Side */}
                  <Card className="flip-card-face ios-card ios-shadow-lg hover:shadow-3xl transition-all duration-500 border-0 rounded-2xl overflow-hidden" style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    display: 'block'
                  }}>
                    {/* Custom Close Button */}
                    <button 
                      onClick={() => onOpenChange(false)}
                      className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-all duration-200 mobile-touch-target shadow-lg"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    {/* Header with profile picture */}
                    <div className="relative h-80 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                      {/* Profile Image */}
                      <button onClick={() => openImageViewer(0)} className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl hover:scale-105 transition-all duration-300 mobile-touch-target backdrop-blur-sm">
                        {profile.avatar_url ? (
                          <OptimizedAvatar
                            src={profile.avatar_url}
                            alt={profile.first_name}
                            fallbackSeed={profile.first_name}
                            className="w-full h-full object-cover"
                            loading="eager"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/20 flex items-center justify-center">
                            <User className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </button>
                      
                      {/* Online Status Badge */}
                      <div className="absolute top-16 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${isUserOnline(profile.user_id) ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                          <span className="text-xs font-medium text-gray-700">
                            {isUserOnline(profile.user_id) 
                              ? 'Online now' 
                              : profile.last_seen 
                                ? getLastSeenText(profile.last_seen)
                                : 'Last seen long ago'
                            }
                          </span>
                        </div>
                      </div>
                      
                      {/* See More Button */}
                      {hasExtendedContent && (
                        <div className="absolute top-4 left-4">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsFlipped(!isFlipped);
                            }}
                            className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 text-white hover:bg-white/30 transition-all duration-200 mobile-touch-target shadow-lg"
                            title="See more details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-medium">More</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-6 space-y-4">
                      {/* Name, Age and Gender */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {profile.first_name} {profile.last_name ? profile.last_name[0] + '.' : ''}
                        </h3>
                        <div className="flex items-center gap-3">
                          {profile.gender && (
                            <span className="text-sm text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">{profile.gender}</span>
                          )}
                          {displayAge && (
                            <span className="text-lg font-semibold text-gray-700 bg-blue-50 px-3 py-1 rounded-full">{displayAge}</span>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      {displayLocation && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <MapPin className="w-5 h-5 flex-shrink-0 text-blue-500" />
                          <span className="text-base font-medium truncate">{displayLocation}</span>
                        </div>
                      )}

                      {/* MS Info */}
                      {profile.ms_subtype && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm px-3 py-1.5 uppercase font-semibold border-purple-200 text-purple-700 bg-purple-50">
                            {profile.ms_subtype}
                          </Badge>
                        </div>
                      )}

                      {/* Hobbies */}
                      {profile.hobbies && profile.hobbies.length > 0 && (
                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-2">Interests:</div>
                          <div className="flex flex-wrap gap-2">
                            {(showAllHobbies ? profile.hobbies : profile.hobbies.slice(0, 4)).map((hobby, index) => (
                              <Badge key={index} variant="secondary" className="text-sm px-3 py-1.5">
                                {hobby}
                              </Badge>
                            ))}
                            {profile.hobbies.length > 4 && (
                              <button
                                onClick={() => setShowAllHobbies(!showAllHobbies)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                <Badge variant="outline" className="text-sm px-3 py-1.5 hover:bg-blue-50 cursor-pointer">
                                  {showAllHobbies ? 'Show Less' : `+${profile.hobbies.length - 4}`}
                                </Badge>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* About section */}
                      {displayAbout && (
                        <div className={`${showAllAbout ? 'max-h-48 overflow-y-auto pr-2' : ''}`}>
                          <p className={`text-base text-gray-600 leading-relaxed whitespace-pre-wrap ${!showAllAbout ? 'line-clamp-3' : ''}`}>
                            {displayAbout}
                          </p>
                          {displayAbout.length > 120 && (
                            <button
                              onClick={() => setShowAllAbout(!showAllAbout)}
                              className="text-sm text-blue-600 hover:text-blue-700 mt-2 font-medium"
                            >
                              {showAllAbout ? 'Show Less' : 'Read More'}
                            </button>
                          )}
                        </div>
                      )}
                    </CardContent>

                    {/* Action Buttons */}
                    {showActions && (onPass || onLike) && (
                      <div className="p-6 pt-4 flex gap-3">
                        {onPass && (
                          <Button
                            onClick={onPass}
                            variant="outline"
                            className="flex-1 h-12 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl ios-bounce ios-spring text-base"
                          >
                            <X className="w-5 h-5 mr-2" />
                            Pass
                          </Button>
                        )}
                        {onLike && (
                          <Button
                            onClick={onLike}
                            disabled={isLiking}
                            className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] group text-base"
                          >
                            <HandHeart className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            {isLiking ? 'Saying Hi...' : 'Say Hi!'}
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>

                  {/* Back Side with extended content */}
                  {hasExtendedContent && (
                    <Card className="flip-card-face flip-card-back ios-card ios-shadow-lg hover:shadow-3xl transition-all duration-500 border-0 rounded-2xl overflow-hidden" style={{
                      width: '100%',
                      height: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      transform: 'rotateY(180deg)',
                      backfaceVisibility: 'hidden'
                    }}>
                      <div className="relative h-40 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-black/10"></div>
                        
                        {/* Back Button */}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsFlipped(false);
                          }}
                          className="absolute top-3 left-3 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 mobile-touch-target shadow-lg"
                          title="Back to main"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        
                        <div className="text-center text-white z-10">
                          <h3 className="text-xl font-bold">{profile.first_name}'s Details</h3>
                          <p className="text-base opacity-90">Extended Profile</p>
                        </div>
                      </div>

                      <CardContent className="p-6 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(100% - 10rem)' }}>
                        {/* Additional Photos */}
                        {profile.additional_photos && profile.additional_photos.length > 0 && (
                          <div>
                            <h4 className="font-bold text-gray-900 mb-3 text-base">More Photos</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {profile.additional_photos.slice(0, 4).map((photoUrl, index) => (
                                <button
                                  key={index}
                                  onClick={() => openImageViewer(index + 1)}
                                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:scale-105 transition-transform duration-200"
                                >
                                  <img
                                    src={photoUrl}
                                    alt={`${profile.first_name}'s photo ${index + 2}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Prompts with improved styling - no title */}
                        {profile.selected_prompts && profile.selected_prompts.length > 0 && (
                          <div className="space-y-4">
                            {profile.selected_prompts.map((prompt, index) => (
                              <div key={index} className="bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-sm font-semibold text-gray-700 mb-3 leading-tight">{prompt.question}</p>
                                <p className="text-base text-gray-900 leading-relaxed">{prompt.answer}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Symptoms */}
                        {profile.symptoms && profile.symptoms.length > 0 && (
                          <div>
                            <h4 className="font-bold text-gray-900 mb-3 text-base">Symptoms</h4>
                            <div className="flex flex-wrap gap-2">
                              {profile.symptoms.map((symptom, index) => (
                                <Badge key={index} variant="outline" className="text-sm px-3 py-1.5">
                                  {symptom}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Medications */}
                        {profile.medications && profile.medications.length > 0 && (
                          <div>
                            <h4 className="font-bold text-gray-900 mb-3 text-base">Medications</h4>
                            <div className="flex flex-wrap gap-2">
                              {profile.medications.map((medication, index) => (
                                <Badge key={index} variant="secondary" className="text-sm px-3 py-1.5">
                                  {medication}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>

                      {/* Action Buttons on Back */}
                      {showActions && (onPass || onLike) && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
                          <div className="flex gap-3">
                            {onPass && (
                              <Button
                                onClick={onPass}
                                variant="outline"
                                className="flex-1 h-12 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl ios-bounce ios-spring text-base"
                              >
                                <X className="w-5 h-5 mr-2" />
                                Pass
                              </Button>
                            )}
                            {onLike && (
                              <Button
                                onClick={onLike}
                                disabled={isLiking}
                                className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] group text-base"
                              >
                                <HandHeart className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                {isLiking ? 'Saying Hi...' : 'Say Hi!'}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ProfileImageViewer
        images={allImages}
        currentIndex={imageViewerIndex}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
      />
    </>
  );
};

export default UnifiedProfileView;
