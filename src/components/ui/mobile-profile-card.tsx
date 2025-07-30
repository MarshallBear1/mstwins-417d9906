import { useState, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, User, Heart, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { OptimizedAvatar } from "@/components/PerformanceOptimizer";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  location: string;
  avatar_url?: string;
  ms_subtype?: string;
  diagnosis_year?: number;
  hobbies?: string[];
  about_me?: string;
  photos?: { url: string; caption?: string }[];
  selected_prompts?: { question: string; answer: string }[];
  last_seen: string | null;
}

interface MobileProfileCardProps {
  profile: Profile;
  onImageClick?: (index: number) => void;
  onLike?: () => void;
  onPass?: () => void;
  className?: string;
  style?: React.CSSProperties;
  isUserOnline?: (userId: string) => boolean;
  getLastSeenText?: (lastSeen: string | null) => string;
}

const MobileProfileCard = ({
  profile,
  onImageClick,
  onLike,
  onPass,
  className,
  style,
  isUserOnline: propIsUserOnline,
  getLastSeenText: propGetLastSeenText,
  ...props
}: MobileProfileCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAllAbout, setShowAllAbout] = useState(false);
  
  // Use the hook for realtime presence if not provided as props
  const { isUserOnline: hookIsUserOnline, getLastSeenText: hookGetLastSeenText } = useRealtimePresence();
  const isUserOnline = propIsUserOnline || hookIsUserOnline;
  const getLastSeenText = propGetLastSeenText || hookGetLastSeenText;

  const calculateAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const hasExtendedContent = Boolean(
    (profile.photos && profile.photos.length > 1) ||
    (profile.selected_prompts && profile.selected_prompts.length > 0) ||
    (profile.about_me && profile.about_me.length > 80) ||
    profile.hobbies?.length ||
    profile.ms_subtype ||
    profile.diagnosis_year
  );

  return (
    <div 
      className={cn("flip-card", className)} 
      style={{ 
        ...style, 
        minHeight: '420px', 
        maxWidth: '300px', 
        perspective: '1000px',
        position: 'relative'
      }}
      {...props}
    >
      <div className={cn("flip-card-inner", isFlipped && "rotate-y-180")} style={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}>
        {/* Front Side */}
        <Card className="flip-card-face shadow-2xl hover:shadow-3xl transition-all duration-500 bg-white border-0 rounded-2xl overflow-hidden" style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'block'
        }}>
          {/* Smaller Header focused on profile picture */}
          <div className="relative h-32 bg-blue-500 flex items-center justify-center overflow-hidden">
            {/* Smaller Profile Image with reduced border */}
            <button onClick={() => onImageClick?.(0)} className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-lg hover:scale-110 transition-all duration-300 mobile-touch-target">
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
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
            </button>
            
            {/* Online Status Badge with Last Seen */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isUserOnline(profile.user_id) ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-xs font-medium text-gray-700">
                  {isUserOnline(profile.user_id) ? 'Online' : getLastSeenText(profile.last_seen)}
                </span>
              </div>
            </div>
            
            {/* See More Button - Single button only */}
            {hasExtendedContent && (
              <div className="absolute top-3 left-3">
                <button 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1 text-white hover:bg-white/30 transition-all duration-200 mobile-touch-target shadow-lg"
                  title="See more details"
                >
                  <Eye className="w-3 h-3" />
                  <span className="text-xs font-medium">See More</span>
                </button>
              </div>
            )}
          </div>

          {/* Modern Content Section */}
          <CardContent className="p-4 space-y-3">
            {/* Compact Name and Age */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{profile.first_name}</h3>
              <span className="text-sm font-medium text-gray-600">{calculateAge(profile.date_of_birth)}</span>
            </div>

            {/* Compact Location */}
            {profile.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">{profile.location}</span>
              </div>
            )}

            {/* MS Info - more compact */}
            {profile.ms_subtype && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs px-2 py-1">
                  {profile.ms_subtype}
                </Badge>
                {profile.diagnosis_year && (
                  <span className="text-xs text-gray-500">
                    Diagnosed {profile.diagnosis_year}
                  </span>
                )}
              </div>
            )}

            {/* Compact Hobbies */}
            {profile.hobbies && profile.hobbies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {profile.hobbies.slice(0, 3).map((hobby, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                    {hobby}
                  </Badge>
                ))}
                {profile.hobbies.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    +{profile.hobbies.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Compact About */}
            {profile.about_me && (
              <div>
                <p className={`text-sm text-gray-600 leading-relaxed ${!showAllAbout ? 'line-clamp-2' : ''}`}>
                  {profile.about_me}
                </p>
                {profile.about_me.length > 80 && (
                  <button
                    onClick={() => setShowAllAbout(!showAllAbout)}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium"
                  >
                    {showAllAbout ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
            )}
          </CardContent>

          {/* Compact Action Buttons */}
          {(onPass || onLike) && (
            <div className="p-4 pt-3 flex gap-2">
              {onPass && (
                <Button
                  onClick={onPass}
                  variant="outline"
                  className="flex-1 h-10 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-200"
                >
                  <X className="w-4 h-4 mr-1" />
                  Pass
                </Button>
              )}
              {onLike && (
                <Button
                  onClick={onLike}
                  className="flex-1 h-10 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] group"
                >
                  <Heart className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" fill="currentColor" />
                  Like
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Back Side with extended content... */}
        {hasExtendedContent && (
          <Card className="flip-card-face flip-card-back shadow-2xl hover:shadow-3xl transition-all duration-500 bg-white border-0 rounded-2xl overflow-hidden" style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden'
          }}>
            {/* Back content implementation continues... */}
            <div className="relative h-32 bg-purple-500 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              
              {/* Back Button */}
              <button 
                onClick={() => setIsFlipped(false)}
                className="absolute top-3 left-3 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 mobile-touch-target shadow-lg"
                title="Back to main"
              >
                <Eye className="w-3 h-3" />
              </button>
              
              <div className="text-center text-white z-10">
                <h3 className="text-lg font-bold">{profile.first_name}'s Details</h3>
                <p className="text-sm opacity-90">Extended Profile</p>
              </div>
            </div>

            <CardContent className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 8rem)' }}>
              {/* Additional Photos */}
              {profile.photos && profile.photos.length > 1 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">More Photos</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {profile.photos.slice(1, 5).map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => onImageClick?.(index + 1)}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:scale-105 transition-transform duration-200"
                      >
                        <img
                          src={photo.url}
                          alt={`${profile.first_name}'s photo ${index + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompts */}
              {profile.selected_prompts && profile.selected_prompts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">About Me</h4>
                  <div className="space-y-3">
                    {profile.selected_prompts.slice(0, 2).map((prompt, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">{prompt.question}</p>
                        <p className="text-sm text-gray-900">{prompt.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </CardContent>

            {/* Action Buttons on Back */}
            {(onPass || onLike) && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                  {onPass && (
                    <Button
                      onClick={onPass}
                      variant="outline"
                      className="flex-1 h-10 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-200"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Pass
                    </Button>
                  )}
                  {onLike && (
                    <Button
                      onClick={onLike}
                      className="flex-1 h-10 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] group"
                    >
                      <Heart className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" fill="currentColor" />
                      Like
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default memo(MobileProfileCard);