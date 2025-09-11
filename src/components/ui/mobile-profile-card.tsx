import { useState, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, User, Heart, X, Eye, HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { OptimizedAvatar } from "@/components/PerformanceOptimizer";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  age: number | null;
  city: string;
  gender: string | null;
  ms_subtype: string | null;
  avatar_url: string | null;
  about_me_preview: string | null;
  hobbies: string[];
  additional_photos?: string[];
  selected_prompts?: any;
  extended_profile_completed?: boolean;
  last_seen?: string | null;
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
  isFlipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
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
  isFlipped: propIsFlipped,
  onFlipChange,
  ...props
}: MobileProfileCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAllAbout, setShowAllAbout] = useState(false);
  const [showAllHobbies, setShowAllHobbies] = useState(false);
  
  // Use external flip state if provided, otherwise use internal state
  const actualIsFlipped = propIsFlipped !== undefined ? propIsFlipped : isFlipped;
  const handleFlipChange = (newFlipped: boolean) => {
    if (onFlipChange) {
      onFlipChange(newFlipped);
    } else {
      setIsFlipped(newFlipped);
    }
  };
  
  // Use the hook for realtime presence if not provided as props
  const { isUserOnline: hookIsUserOnline, getLastSeenText: hookGetLastSeenText } = useRealtimePresence();
  const isUserOnline = propIsUserOnline || hookIsUserOnline;
  const getLastSeenText = propGetLastSeenText || hookGetLastSeenText;

  const calculateAge = (age: number | null) => {
    return age;
  };

  const hasExtendedContent = Boolean(
    (profile.additional_photos && profile.additional_photos.length > 0) ||
    (profile.selected_prompts && profile.selected_prompts.length > 0) ||
    (profile.about_me_preview && profile.about_me_preview.length > 80) ||
    profile.hobbies?.length ||
    profile.ms_subtype
  );

  return (
    <div 
      className={cn("flip-card", className)} 
      style={{ 
        ...style, 
        height: '65vh', // Slightly less than 3/4 viewport height
        minHeight: '650px', // Reduced minimum height
        width: '340px', // Card width
        perspective: '1000px',
        position: 'relative'
      }}
      data-swipeable="true"
      {...props}
    >
      <div className={cn("flip-card-inner", actualIsFlipped && "rotate-y-180")} style={{
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
          {/* Full gradient background covering entire front card */}
          <div className="relative h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex flex-col items-center justify-start overflow-hidden pt-16">
            
            {/* Show More Button - back to top left */}
            {hasExtendedContent && (
              <div className="absolute top-4 left-4">
                <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFlipChange(!actualIsFlipped);
                }}
                className="bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 text-white hover:bg-white/30 transition-all duration-200 mobile-touch-target shadow-lg"
                title="Show more details"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Show More</span>
              </button>
              </div>
            )}

            {/* Larger Profile Image with proper aspect ratio */}
            <button onClick={() => onImageClick?.(0)} className="relative w-40 h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl hover:scale-105 transition-all duration-300 mobile-touch-target mb-6">
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
            {/* Last Seen - top right */}
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg border border-white/20">
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${isUserOnline(profile.user_id) ? 'bg-green-400 animate-pulse shadow-lg' : 'bg-gray-300'}`} />
                <span className="text-xs font-medium text-white">
                  {isUserOnline(profile.user_id) 
                    ? 'Online' 
                    : getLastSeenText(profile.last_seen)
                  }
                </span>
              </div>
            </div>

            {/* Name, Age, Gender, Location, MS Subtype, Interests - positioned with more space */}
            <div className="flex-1 flex flex-col justify-center px-4 text-white space-y-4 mt-4 mb-16">
              {/* Name and basic info */}
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <h3 className="text-2xl font-bold text-white">{profile.first_name}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {calculateAge(profile.age) && (
                      <span className="text-base font-semibold text-white bg-white/20 px-3 py-1 rounded-full">{calculateAge(profile.age)}</span>
                    )}
                    {profile.gender && (
                      <span className="text-base font-semibold text-white bg-white/20 px-3 py-1 rounded-full capitalize">{profile.gender}</span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {/* Location */}
                  {profile.city && (
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{profile.city}</span>
                    </div>
                  )}
                  
                  {/* MS Subtype */}
                  {profile.ms_subtype && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white/90">MS Subtype:</span>
                      <span className="text-sm font-semibold text-white bg-white/20 px-2 py-1 rounded-full uppercase">
                        {profile.ms_subtype}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Interests */}
              {profile.hobbies && profile.hobbies.length > 0 && (
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-base font-semibold text-white mb-3">Interests:</div>
                   <div className="flex flex-wrap gap-2">
                     {(showAllHobbies ? profile.hobbies : profile.hobbies.slice(0, 4)).map((hobby, index) => {
                       const colors = [
                         'bg-pink-400/80 border-pink-300/50 text-white',
                         'bg-purple-400/80 border-purple-300/50 text-white', 
                         'bg-indigo-400/80 border-indigo-300/50 text-white',
                         'bg-blue-400/80 border-blue-300/50 text-white',
                         'bg-green-400/80 border-green-300/50 text-white',
                         'bg-yellow-400/80 border-yellow-300/50 text-white',
                         'bg-orange-400/80 border-orange-300/50 text-white',
                         'bg-red-400/80 border-red-300/50 text-white'
                       ];
                       return (
                         <Badge 
                           key={index} 
                           variant="secondary" 
                           className={`text-sm px-3 py-1.5 transition-colors shadow-sm ${colors[index % colors.length]}`}
                         >
                           {hobby}
                         </Badge>
                       );
                     })}
                    {profile.hobbies.length > 4 && (
                      <button
                        onClick={() => setShowAllHobbies(!showAllHobbies)}
                        className="text-sm text-white hover:text-white/80 font-semibold transition-colors"
                      >
                        <Badge variant="outline" className="text-sm px-3 py-1.5 hover:bg-white/20 cursor-pointer border-white/40 text-white">
                          {showAllHobbies ? 'Show Less' : `+${profile.hobbies.length - 4} more`}
                        </Badge>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pass/Connect Action Buttons - at the very bottom */}
            {(onPass || onLike) && (
              <div className="absolute bottom-4 left-4 right-4 flex gap-3">
                {onPass && (
                  <Button
                    onClick={onPass}
                    variant="outline"
                    className="flex-1 h-11 bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white text-gray-700 font-semibold rounded-xl transition-all duration-200 shadow-lg"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Pass
                  </Button>
                )}
                {onLike && (
                  <Button
                    onClick={onLike}
                    className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <HandHeart className="w-5 h-5 mr-2" />
                    Connect
                  </Button>
                )}
              </div>
            )}
          </div>

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
            <div className="relative h-48 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              
              {/* Back Button */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFlipChange(false);
                }}
                className="absolute top-3 left-3 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 mobile-touch-target shadow-lg"
                title="Back to main"
              >
                <Eye className="w-3 h-3" />
              </button>
              
              {/* Pass/Connect Action Buttons - also on back side */}
              {(onPass || onLike) && (
                <div className="absolute bottom-4 left-4 right-4 flex gap-3">
                  {onPass && (
                    <Button
                      onClick={onPass}
                      variant="outline"
                      className="flex-1 h-11 bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white text-gray-700 font-semibold rounded-xl transition-all duration-200 shadow-lg"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Pass
                    </Button>
                  )}
                  {onLike && (
                    <Button
                      onClick={onLike}
                      className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <HandHeart className="w-5 h-5 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              )}
              
              <div className="text-center text-white z-10">
                <h3 className="text-xl font-bold">{profile.first_name}'s Details</h3>
                <p className="text-base opacity-90">Extended Profile</p>
              </div>
            </div>

            <CardContent className="p-6 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(100% - 12rem)' }}>
              {/* About Me section - moved from front */}
              {profile.about_me_preview && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-base font-semibold text-gray-800 mb-3">About Me:</div>
                  <p className={`text-base text-gray-800 leading-relaxed whitespace-pre-wrap ${!showAllAbout ? 'line-clamp-3' : ''}`}>
                    {profile.about_me_preview}
                  </p>
                  {profile.about_me_preview.length > 100 && (
                    <button
                      onClick={() => setShowAllAbout(!showAllAbout)}
                      className="text-sm text-green-600 hover:text-green-700 mt-3 font-semibold transition-colors duration-200"
                    >
                      {showAllAbout ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </div>
              )}

              {/* Additional Photos */}
              {profile.additional_photos && profile.additional_photos.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-base">More Photos</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {profile.additional_photos.slice(0, 4).map((photoUrl, index) => (
                      <button
                        key={index}
                        onClick={() => onImageClick?.(index + 1)}
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

              {/* Prompts */}
              {profile.selected_prompts && profile.selected_prompts.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-base">About Me Prompts</h4>
                  <div className="space-y-3">
                    {profile.selected_prompts.map((prompt, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-semibold text-gray-700 mb-2">{prompt.question}</p>
                        <p className="text-base text-gray-900">{prompt.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default memo(MobileProfileCard);