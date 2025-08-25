import { useState } from 'react';
import { Heart, X, RotateCcw } from 'lucide-react';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import MobileProfileCard from '@/components/ui/mobile-profile-card';
import { useRealtimePresence } from '@/hooks/useRealtimePresence';

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
  selected_prompts?: { question: string; answer: string; }[];
  extended_profile_completed?: boolean;
}

interface SwipeableProfileCardProps {
  profile: Profile;
  onLike: (profileId: string) => void;
  onPass: (profileId: string) => void;
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
  const [isFlipped, setIsFlipped] = useState(false);

  const handleLike = () => {
    like();
    onLike(profile.id);
  };

  const handlePass = () => {
    errorFeedback();
    onPass(profile.id);
  };

  const { swipeHandlers, swipeProgress, isTransitioning } = useSwipeGestures({
    onSwipeRight: handleLike,
    onSwipeLeft: handlePass,
    threshold: 100,
    preventDefaultTouchmove: true,
  });

  // Calculate opacity and rotation based on swipe progress
  const getSwipeStyles = () => {
    const { x } = swipeProgress;
    const maxSwipe = 150;
    const progress = Math.min(Math.abs(x) / maxSwipe, 1);
    const rotation = (x / maxSwipe) * 15;
    
    return {
      transform: `translateX(${x * 0.8}px) rotate(${rotation}deg)`,
      opacity: isTransitioning ? 0 : 1 - progress * 0.3,
      transition: isTransitioning ? 'all 0.3s ease-out' : 'none',
    };
  };

  const showLikeIndicator = swipeProgress.x > 50;
  const showPassIndicator = swipeProgress.x < -50;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Swipe Indicators */}
      {showLikeIndicator && (
        <div className="absolute top-8 right-8 z-20 bg-green-500 text-white p-3 rounded-full shadow-lg animate-scale-in">
          <Heart className="w-6 h-6 fill-current" />
        </div>
      )}
      
      {showPassIndicator && (
        <div className="absolute top-8 left-8 z-20 bg-red-500 text-white p-3 rounded-full shadow-lg animate-scale-in">
          <X className="w-6 h-6" />
        </div>
      )}

      {/* Main Card */}
      <div 
        className="select-none touch-none"
        style={getSwipeStyles()}
        {...swipeHandlers}
      >
        <MobileProfileCard
          profile={profile}
          onImageClick={onImageClick}
          isUserOnline={isUserOnline}
          getLastSeenText={getLastSeenText}
          isFlipped={isFlipped}
          onFlipChange={setIsFlipped}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-6 mt-6">
        <button
          onClick={handlePass}
          className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 
                     text-red-500 w-14 h-14 rounded-full flex items-center justify-center
                     transition-all duration-200 hover:scale-110 active:scale-95"
          disabled={isTransitioning}
        >
          <X className="w-6 h-6" />
        </button>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="bg-primary/10 border border-primary/20 hover:bg-primary/20 
                     text-primary w-14 h-14 rounded-full flex items-center justify-center
                     transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={handleLike}
          className="bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 
                     text-green-500 w-14 h-14 rounded-full flex items-center justify-center
                     transition-all duration-200 hover:scale-110 active:scale-95"
          disabled={isTransitioning}
        >
          <Heart className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default SwipeableProfileCard;