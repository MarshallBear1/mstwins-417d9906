import React, { useState } from 'react';
import { Heart, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/OptimizedComponents';
import { useRealtimePresence } from '@/hooks/useRealtimePresence';
import { useIsMobile } from '@/hooks/use-mobile';

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
  symptoms?: string[];
  medications?: string[];
  last_seen?: string;
}

interface MobileProfileCardProps {
  profile: Profile;
  onImageClick?: (imageIndex: number) => void;
  onLike?: () => void;
  onPass?: () => void;
  className?: string;
  style?: React.CSSProperties;
  isUserOnline?: (userId: string) => boolean;
  getLastSeenText?: (userId: string, lastSeen?: string) => string;
  onShowExtended?: () => void;
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
  onShowExtended,
  ...props
}: MobileProfileCardProps) => {
  const [showAllHobbies, setShowAllHobbies] = useState(false);
  const isMobile = useIsMobile();
  
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
    profile.ms_subtype ||
    (profile.symptoms && profile.symptoms.length > 0) ||
    (profile.medications && profile.medications.length > 0)
  );

  const hasInterests = Boolean(profile.hobbies && profile.hobbies.length > 0);
  
  // Adjust card dimensions based on screen size and content
  const cardHeight = isMobile ? '85vh' : 'auto';
  const imageHeight = isMobile ? '45%' : '300px';

  return (
    <Card className="w-full h-full shadow-xl border-0 bg-white rounded-2xl overflow-hidden">
      <div className="relative h-full flex flex-col">
        {/* Profile Image Section */}
        <div className="relative flex-shrink-0" style={{ height: imageHeight }}>
          <button
            onClick={() => onImageClick?.(0)}
            className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center overflow-hidden cursor-pointer group"
            data-no-swipe="true"
          >
            <Avatar className="w-full h-full">
              <AvatarImage 
                src={profile.avatar_url || ''}
                alt={`${profile.first_name}'s profile`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <AvatarFallback className="w-full h-full text-2xl">{profile.first_name[0]}</AvatarFallback>
            </Avatar>
          </button>

          {/* Online Status Indicator */}
          {isUserOnline(profile.user_id) && (
            <div className="absolute top-4 right-4 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-lg animate-pulse" />
          )}
        </div>

        {/* Profile Info Section */}
        <CardContent className="flex-1 p-5 pb-6 flex flex-col justify-between">
          {/* Basic Info */}
          <div className="space-y-4">
            {/* Name and Age */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {profile.first_name}
                {profile.age && <span className="text-xl text-gray-600 ml-2">{calculateAge(profile.age)}</span>}
              </h2>
              
              {/* Location and Gender */}
              <div className="flex items-center gap-2 mt-1">
                {profile.city && <span className="text-gray-600">{profile.city}</span>}
                {profile.city && profile.gender && <span className="text-gray-400">•</span>}
                {profile.gender && <span className="text-gray-600 capitalize">{profile.gender}</span>}
              </div>

              {/* MS Subtype */}
              {profile.ms_subtype && (
                <div className="mt-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    {profile.ms_subtype}
                  </Badge>
                </div>
              )}
            </div>

            {/* About Me Preview */}
            {profile.about_me_preview && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm font-semibold text-gray-700 mb-2">About Me:</div>
                <div className="text-sm text-gray-800 line-clamp-2 leading-relaxed">
                  {profile.about_me_preview.length > 120 
                    ? `${profile.about_me_preview.substring(0, 120)}...` 
                    : profile.about_me_preview
                  }
                </div>
              </div>
            )}

            {/* Interests/Hobbies */}
            {hasInterests && (
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">Interests:</div>
                <div className="flex flex-wrap gap-2">
                  {(showAllHobbies ? profile.hobbies : profile.hobbies.slice(0, 5)).map((hobby, index) => {
                    const colors = [
                      'bg-purple-100 text-purple-800 border-purple-200',
                      'bg-blue-100 text-blue-800 border-blue-200',
                      'bg-green-100 text-green-800 border-green-200',
                      'bg-orange-100 text-orange-800 border-orange-200',
                      'bg-pink-100 text-pink-800 border-pink-200'
                    ];
                    return (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className={`text-xs px-2 py-1 ${colors[index % colors.length]}`}
                      >
                        {hobby}
                      </Badge>
                    );
                  })}
                  {profile.hobbies.length > 5 && (
                    <button
                      data-no-swipe="true"
                      onClick={() => setShowAllHobbies(!showAllHobbies)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      <Badge variant="outline" className="text-xs px-2 py-1 hover:bg-purple-100 cursor-pointer border-purple-300 text-purple-600">
                        {showAllHobbies ? 'Show Less' : `+${profile.hobbies.length - 5} more`}
                      </Badge>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Last seen instead of "member" */}
            <div className="text-sm text-gray-500">
              {getLastSeenText(profile.user_id, profile.last_seen)}
            </div>

            {/* Show More Button - Only if extended content exists */}
            {hasExtendedContent && (
              <div className="pt-2">
                <button
                  data-no-swipe="true"
                  onClick={() => onShowExtended?.()}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-2.5 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg text-sm"
                >
                  Show More
                </button>
              </div>
            )}
          </div>
        </CardContent>

        {/* Action Buttons */}
        <div className="flex-shrink-0 px-5 pb-5">
          <div className="flex gap-3">
            <button
              data-no-swipe="true"
              onClick={onPass}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Pass
            </button>
            <button
              data-no-swipe="true"
              onClick={onLike}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5" />
              Say Hi!
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(MobileProfileCard);