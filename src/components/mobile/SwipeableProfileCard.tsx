import React, { useState } from 'react';
import { Heart, X } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import MobileProfileCard from '@/components/ui/mobile-profile-card';
import ExtendedProfileOverlay from '@/components/ExtendedProfileOverlay';
import { useRealtimePresence } from '@/hooks/useRealtimePresence';

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
}

interface SwipeableProfileCardProps {
  profile: Profile;
  onLike: (userId: string) => void;
  onPass: (userId: string) => void;
  onImageClick?: (imageIndex: number) => void;
  className?: string;
}

const SwipeableProfileCard = ({ 
  profile, 
  onLike, 
  onPass, 
  onImageClick,
  className 
}: SwipeableProfileCardProps) => {
  const { isUserOnline, getLastSeenText } = useRealtimePresence();
  const { like, errorFeedback } = useHaptics();
  const [showExtended, setShowExtended] = useState(false);

  const handleLike = () => {
    like();
    setShowExtended(false); // Close extended view when liking
    onLike(profile.user_id);
  };

  const handlePass = () => {
    errorFeedback();
    setShowExtended(false); // Close extended view when passing
    onPass(profile.user_id);
  };

  return (
    <div className={cn("relative w-full max-w-sm mx-auto bg-transparent", className)} style={{ width: '100%', maxWidth: '384px', zIndex: 1 }}>
      {/* Main Card */}
      <div className="w-full relative">
        <MobileProfileCard
          profile={profile}
          onImageClick={onImageClick}
          onLike={handleLike}
          onPass={handlePass}
          isUserOnline={isUserOnline}
          getLastSeenText={getLastSeenText}
          onShowExtended={() => setShowExtended(true)}
        />
      </div>

      {/* Extended Profile Overlay */}
      <ExtendedProfileOverlay
        profile={profile}
        isOpen={showExtended}
        onClose={() => setShowExtended(false)}
        onLike={handleLike}
        onPass={handlePass}
        onImageClick={onImageClick}
        isUserOnline={isUserOnline}
        getLastSeenText={getLastSeenText}
      />
    </div>
  );
};

export default SwipeableProfileCard;