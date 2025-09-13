import React, { useState } from 'react';
import { HeartHandshake, X, RotateCcw, Heart } from 'lucide-react';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import MobileProfileCard from '@/components/ui/mobile-profile-card';
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
  onFlipChange?: (flipped: boolean) => void;
  className?: string;
}

const SwipeableProfileCard = ({ 
  profile, 
  onLike, 
  onPass, 
  onImageClick,
  onFlipChange,
  className 
}: SwipeableProfileCardProps) => {
  const { isUserOnline, getLastSeenText } = useRealtimePresence();
  const { like, errorFeedback } = useHaptics();
  const [isFlipped, setIsFlipped] = useState(false);

  // Prevent background/page scroll when extended profile (back) is open
  React.useEffect(() => {
    if (isFlipped) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isFlipped]);
  
  const handleFlipChange = (flipped: boolean) => {
    console.log('🔄 SwipeableProfileCard flip change:', flipped);
    setIsFlipped(flipped);
    onFlipChange?.(flipped);
  };

  const handleLike = () => {
    like();
    onLike(profile.user_id);
  };

  const handlePass = () => {
    errorFeedback();
    onPass(profile.user_id);
  };

  const { swipeHandlers, swipeProgress, isTransitioning } = useSwipeGestures({
    onSwipeRight: isFlipped ? undefined : handleLike,
    onSwipeLeft: isFlipped ? undefined : handlePass,
    threshold: 100,
    preventDefaultTouchmove: !isFlipped,
  });

  // Calculate opacity and rotation based on swipe progress
  const getSwipeStyles = () => {
    const { x } = swipeProgress;
    const maxSwipe = 150;
    const progress = Math.min(Math.abs(x) / maxSwipe, 1);
    const rotation = (x / maxSwipe) * 12;
    
    return {
      transform: `translateX(${x * 0.6}px) rotate(${rotation}deg)`,
      opacity: isTransitioning ? 0 : Math.max(0.7, 1 - progress * 0.4),
      transition: isTransitioning ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      willChange: 'transform, opacity',
    };
  };

  const showLikeIndicator = swipeProgress.x > 50;
  const showPassIndicator = swipeProgress.x < -50;

  return (
    <div className={cn("relative w-full max-w-sm mx-auto", className)}>
      {/* Swipe Indicators */}
      {showLikeIndicator && (
        <div className="absolute top-6 right-6 z-20 bg-green-500/95 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-xl animate-scale-in border-2 border-white">
          <Heart className="w-5 h-5 fill-current inline mr-2" />
          <span className="font-semibold text-sm">Like</span>
        </div>
      )}
      
      {showPassIndicator && (
        <div className="absolute top-6 left-6 z-20 bg-red-500/95 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-xl animate-scale-in border-2 border-white">
          <X className="w-5 h-5 inline mr-2" />
          <span className="font-semibold text-sm">Pass</span>
        </div>
      )}

      {/* Main Card */}
      <div 
        className={cn("select-none w-full", !isFlipped && "touch-none")}
        style={getSwipeStyles()}
        {...(!isFlipped && swipeHandlers)}
      >
        <MobileProfileCard
          profile={profile}
          onImageClick={onImageClick}
          onLike={handleLike}
          onPass={handlePass}
          isUserOnline={isUserOnline}
          getLastSeenText={getLastSeenText}
          isFlipped={isFlipped}
          onFlipChange={handleFlipChange}
        />
      </div>

      {/* No external action buttons - handled by MobileProfileCard */}
    </div>
  );
};

export default SwipeableProfileCard;