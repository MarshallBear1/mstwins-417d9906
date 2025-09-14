import React, { useState } from 'react';
import { Heart, X, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useRealtimePresence } from '@/hooks/useRealtimePresence';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatMSSubtype, calculateAge } from '@/lib/formatters';

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
  const [showMore, setShowMore] = useState(false);
  const [expandedInterests, setExpandedInterests] = useState(false);
  const isMobile = useIsMobile();
  
  // Use the hook for realtime presence if not provided as props
  const { isUserOnline: hookIsUserOnline, getLastSeenText: hookGetLastSeenText } = useRealtimePresence();
  const isUserOnline = propIsUserOnline || hookIsUserOnline;
  const getLastSeenText = propGetLastSeenText || hookGetLastSeenText;

  const hasExtendedContent = Boolean(
    (profile.additional_photos && profile.additional_photos.length > 0) ||
    (profile.selected_prompts && profile.selected_prompts.length > 0) ||
    (profile.about_me_preview && profile.about_me_preview.length > 80) ||
    profile.ms_subtype ||
    (profile.symptoms && profile.symptoms.length > 0) ||
    (profile.medications && profile.medications.length > 0)
  );
  
  // Adjust card dimensions based on screen size and content
  const imageHeight = isMobile ? '200px' : '120px'; // Fixed height for image

  return (
    <Card 
      className="shadow-xl border-0 bg-white rounded-2xl overflow-hidden" 
      style={{ width: '360px', maxHeight: isMobile ? '90vh' : 'auto' }}
    >
      <div className="relative flex flex-col">
        {/* Profile Image Section */}
        <div className="relative flex-shrink-0 flex items-center justify-center" style={{ height: imageHeight }}>
          <button
            onClick={() => onImageClick?.(0)}
            className="bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center overflow-hidden cursor-pointer group rounded-full"
            style={{ width: imageHeight, height: imageHeight }}
            data-no-swipe="true"
          >
            <Avatar className="w-full h-full rounded-full">
              <AvatarImage 
                src={profile.avatar_url || ''}
                alt={`${profile.first_name}'s profile`}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 rounded-full"
              />
              <AvatarFallback className="w-full h-full text-2xl rounded-full bg-gradient-to-br from-purple-400 to-blue-500 text-white flex items-center justify-center">
                {profile.first_name[0]}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Online Status Indicator */}
          {isUserOnline(profile.user_id) && (
            <div className="absolute top-4 right-4 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-lg animate-pulse" />
          )}
        </div>

        {/* Profile Info Section */}
        <CardContent className="p-4 pb-2 flex flex-col">
          {/* Basic Info */}
          <div className="space-y-2">
            {/* Name and Age */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {profile.first_name}
                {profile.age && <span className="text-xl text-gray-600 ml-2">{calculateAge(profile.age)}</span>}
              </h2>
              
              {/* Location and Gender */}
              <div className="flex items-center gap-2 mt-1">
                {profile.city && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.city}</span>
                  </div>
                )}
                {profile.gender && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 capitalize">
                    {profile.gender}
                  </Badge>
                )}
              </div>

               {/* MS Subtype */}
               {profile.ms_subtype && (
                 <div className="mt-1 text-sm text-gray-700">
                   <span className="font-medium">MS Subtype:</span>
                   <span className="ml-2">{formatMSSubtype(profile.ms_subtype)}</span>
                 </div>
               )}
            </div>

            {/* Interests - Condensed version for main card */}
            {profile.hobbies && profile.hobbies.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Interests:</div>
                <div className="flex flex-wrap gap-1">
                  {(expandedInterests ? profile.hobbies : profile.hobbies.slice(0, 3)).map((hobby, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs px-2 py-1 bg-purple-100 text-purple-800 border-purple-200"
                    >
                      {hobby}
                    </Badge>
                  ))}
                  {!expandedInterests && profile.hobbies.length > 3 && (
                    <button
                      type="button"
                      data-no-swipe="true"
                      onClick={() => setExpandedInterests(true)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md border border-gray-200 hover:bg-gray-200 transition-colors"
                    >
                      +{profile.hobbies.length - 3}
                    </button>
                  )}
                  {expandedInterests && profile.hobbies.length > 3 && (
                    <button
                      type="button"
                      data-no-swipe="true"
                      onClick={() => setExpandedInterests(false)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md border border-gray-200 hover:bg-gray-200 transition-colors"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Last seen */}
            <div className="text-sm text-gray-500">
              {getLastSeenText(profile.user_id, profile.last_seen)}
            </div>
          </div>

          {/* All buttons in one container with slightly bigger spacing */}
          <div className="space-y-2">
            <button
              data-no-swipe="true"
              onClick={() => onShowExtended?.()}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-2.5 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg text-sm"
            >
              Show More
            </button>
            
            <div className="flex gap-3">
              <button
                data-no-swipe="true"
                onClick={onPass}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Dismiss
              </button>
              <button
                data-no-swipe="true"
                onClick={onLike}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Heart className="w-5 h-5" />
                Connect
              </button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default React.memo(MobileProfileCard);