import { useState, useEffect, memo, useCallback, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, RefreshCw, MapPin, User, X, HandHeart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { useIsMobile } from "@/hooks/use-mobile";

import { useSimpleLikes } from "@/hooks/useSimpleLikes";
import { analytics } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import ProfileImageViewer from "@/components/ProfileImageViewer";
import { useHaptics } from "@/hooks/useHaptics";
import DiscoverProfileCard from "@/components/DiscoverProfileCard";
import { useDiscoverScrollPrevention } from "@/hooks/useDiscoverScrollPrevention";
import MobilePullToRefresh from "@/components/mobile/MobilePullToRefresh";

// Memoize the calculate age function to prevent recalculation
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

// Updated interface to match the secure discovery view
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
  last_seen?: string;
}

// Swipe gesture configuration
const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 0.5;

const DiscoverProfiles = memo(() => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [actionCooldown, setActionCooldown] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const { likeProfile, loading: likeLoading } = useSimpleLikes();
  
  const { vibrate } = useHaptics();
  const { isUserOnline } = useRealtimePresence();
  
  // Prevent scrolling on discover page when card is not flipped
  useDiscoverScrollPrevention({ isDiscoverTab: true, isCardFlipped });
  
  // Swipe gesture state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startTime = useRef(0);

  // Fetch profiles using the secure discovery function
  const fetchProfiles = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('Fetching profiles for user:', user.id);

      // Use the new secure profile matching function
      const { data: discoveryProfiles, error } = await supabase
        .rpc('get_matching_profiles', {
          requesting_user_id: user.id,
          limit_count: 50
        });

      if (error) {
        console.error('Error fetching discovery profiles:', error);
        throw error;
      }

      console.log('Fetched discovery profiles:', discoveryProfiles?.length || 0);
      
      // The profiles are already filtered and randomized by the database function
      setProfiles(discoveryProfiles || []);
      setCurrentIndex(0);
      
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error loading profiles",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Initial load
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);


  // Preload images for better UX
  useEffect(() => {
    if (profiles.length > 0) {
      const preloadImages = profiles.slice(currentIndex, currentIndex + 5).map(profile => {
        if (profile.avatar_url) {
          const img = new Image();
          img.src = profile.avatar_url;
        }
        // Preload additional photos
        profile.additional_photos?.forEach(photo => {
          const img = new Image();
          img.src = photo;
        });
      });
    }
  }, [profiles, currentIndex]);

  // Memoized current profile calculation
  const currentProfile = useMemo(() => {
    return profiles[currentIndex] || null;
  }, [profiles, currentIndex]);

  // Optimized like function with cooldown and immediate UI update
  const handleLikeProfile = useCallback(async (profileUserId: string) => {
    if (!user || actionCooldown) return;

    if (user.id === profileUserId) {
      toast({
        title: "Can't like yourself",
        description: "You can't like your own profile!",
        variant: "destructive"
      });
      return;
    }

    setActionCooldown(true);
    
    // Move to next profile immediately for better UX (optimistic update)
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setIsCardFlipped(false); // Reset flip state for next profile
    
    try {
      console.log('🔄 Attempting to like profile:', profileUserId);
      
      // Use the simple likes hook
      const success = await likeProfile(profileUserId);
      
      if (success) {
        console.log('✅ Profile liked successfully');
        vibrate();
        analytics.track('profile_liked', { liked_user_id: profileUserId });
      } else {
        console.log('❌ Like failed');
        // Revert optimistic update
        setCurrentIndex(currentIndex);
        return;
      }
      
    } catch (error) {
      console.error('❌ Error in handleLikeProfile:', error);
      // Revert optimistic update
      setCurrentIndex(currentIndex);
      toast({
        title: "Error",
        description: "Failed to like profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionCooldown(false);
    }
  }, [user, actionCooldown, currentIndex, likeProfile, vibrate, analytics, toast]);

  // Optimized pass function with cooldown and immediate UI update
  const passProfile = useCallback(async (profileUserId: string) => {
    if (!user || actionCooldown) return;

    setActionCooldown(true);
    
    // Move to next profile immediately (optimistic update)
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setIsCardFlipped(false); // Reset flip state for next profile

    try {
      const { error } = await supabase
        .from('passes')
        .insert({
          passer_id: user.id,
          passed_id: profileUserId
        });

      if (error) throw error;

      vibrate();
      analytics.track('profile_passed', { passed_user_id: profileUserId });

      // Removed toast notification for cleaner UX
    } catch (error) {
      console.error('Error passing profile:', error);
      // Revert optimistic update on error
      setCurrentIndex(currentIndex);
      
      toast({
        title: "Error passing profile",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setActionCooldown(false), 500); // Reduced cooldown
    }
  }, [user, actionCooldown, vibrate, toast, currentIndex]);

  // Memoized image click handler
  const handleImageClick = useCallback((imageIndex: number = 0) => {
    if (currentProfile) {
      const images = [currentProfile.avatar_url, ...(currentProfile.additional_photos || [])].filter(Boolean) as string[];
      setSelectedImages(images);
      setImageViewerOpen(true);
    }
  }, [currentProfile]);

  // Handle refresh for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await fetchProfiles();
  }, [fetchProfiles]);

  // Swipe gesture handlers - MUST be declared before any early returns
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (actionCooldown) return;
    
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    startTime.current = Date.now();
    setIsDragging(true);
  }, [actionCooldown]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || actionCooldown) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
    
    // Determine swipe direction
    if (Math.abs(deltaX) > 50) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(null);
    }
  }, [isDragging, actionCooldown]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging || actionCooldown || !currentProfile) return;
    
    const deltaX = dragOffset.x;
    const deltaTime = Date.now() - startTime.current;
    const velocity = Math.abs(deltaX) / deltaTime;
    
    // Check if swipe meets threshold
    const shouldSwipe = Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD;
    
    if (shouldSwipe) {
      if (deltaX > 0) {
        // Swipe right = like
        handleLikeProfile(currentProfile.user_id);
      } else {
        // Swipe left = pass
        passProfile(currentProfile.user_id);
      }
    }
    
    // Reset swipe state
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
  }, [isDragging, actionCooldown, currentProfile, dragOffset.x, handleLikeProfile, passProfile]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (actionCooldown) return;
    
    startPos.current = { x: e.clientX, y: e.clientY };
    startTime.current = Date.now();
    setIsDragging(true);
  }, [actionCooldown]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || actionCooldown) return;
    
    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
    
    if (Math.abs(deltaX) > 50) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(null);
    }
  }, [isDragging, actionCooldown]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging || actionCooldown || !currentProfile) return;
    
    const deltaX = dragOffset.x;
    const deltaTime = Date.now() - startTime.current;
    const velocity = Math.abs(deltaX) / deltaTime;
    
    const shouldSwipe = Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD;
    
    if (shouldSwipe) {
      if (deltaX > 0) {
        handleLikeProfile(currentProfile.user_id);
      } else {
        passProfile(currentProfile.user_id);
      }
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
  }, [isDragging, actionCooldown, currentProfile, dragOffset.x, handleLikeProfile, passProfile]);

  // Show loading state
  if (loading && profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-gray-600">Finding amazing people for you...</p>
      </div>
    );
  }

  // Show empty state with detailed information
  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            You've seen everyone!
          </h3>
          <p className="text-gray-600 mb-4">
            You've viewed all available profiles. Check back later for new members, or try adjusting your preferences.
          </p>
          
          {/* Show activity summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm">
            <h4 className="font-medium text-blue-900 mb-2">Your Activity:</h4>
            <p className="text-blue-700">You've interacted with most profiles in our community!</p>
            <p className="text-blue-600 text-xs mt-1">New profiles appear as people join MStwins.</p>
          </div>
          
          <div className="flex space-x-3">
            <Button onClick={fetchProfiles} variant="outline" className="text-primary border-primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => {
                // Reset passes for this user (admin function)
                if (window.confirm('Reset your pass history? This will show profiles you previously passed on.')) {
                  supabase
                    .from('passes')
                    .delete()
                    .eq('passer_id', user?.id)
                    .then(() => {
                      toast({
                        title: "Pass history cleared",
                        description: "You can now see profiles you previously passed on."
                      });
                      fetchProfiles();
                    });
                }
              }}
              className="bg-gradient-primary text-white"
            >
              See Skipped Profiles
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div className="flex flex-col items-center justify-start min-h-[80vh] px-4 relative pt-6">
      {/* Profile Card Stack */}
      {currentProfile && (
        <div className="relative w-full max-w-sm mx-auto">
          {/* Card with swipe animation */}
          <div
            ref={cardRef}
            className="relative touch-none select-none cursor-grab active:cursor-grabbing"
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
              zIndex: 10
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={isDragging ? handleMouseMove : undefined}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Swipe indicators */}
            {isDragging && swipeDirection && (
              <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-between px-8">
                {swipeDirection === 'right' && (
                  <div className="bg-blue-500 text-white px-6 py-3 rounded-full font-bold text-xl shadow-2xl transform rotate-12 border-4 border-white">
                    <HandHeart className="w-6 h-6 mr-2 inline" />
                    CONNECT
                  </div>
                )}
                {swipeDirection === 'left' && (
                  <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-xl shadow-2xl transform -rotate-12 border-4 border-white ml-auto">
                    <X className="w-6 h-6 mr-2 inline" />
                    PASS
                  </div>
                )}
              </div>
            )}
            
            <DiscoverProfileCard 
              profile={currentProfile} 
              isFlipped={isCardFlipped}
              onFlipChange={setIsCardFlipped}
            />
          </div>
          
          {/* Next card preview (slightly behind) */}
          {profiles[currentIndex + 1] && (
            <div 
              className="absolute inset-0 -z-10"
              style={{
                transform: 'scale(0.95) translateY(10px)',
                opacity: 0.5
              }}
            >
              <DiscoverProfileCard 
                profile={profiles[currentIndex + 1]} 
                isFlipped={false}
                onFlipChange={() => {}}
              />
            </div>
          )}
        </div>
      )}

      {/* Modern Action Buttons - Fixed at bottom */}
      {currentProfile && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex justify-center items-center gap-6">
          <Button
            onClick={() => passProfile(currentProfile.user_id)}
            size="lg"
            variant="outline"
            className="w-16 h-16 rounded-full border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 bg-white/90 backdrop-blur-sm transition-all duration-200 group shadow-lg"
            disabled={actionCooldown}
          >
            <X className="w-6 h-6 text-gray-600 group-hover:text-red-500 transition-colors" />
          </Button>
          
          <Button
            onClick={() => handleLikeProfile(currentProfile.user_id)}
            size="lg"
            className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 group"
            disabled={actionCooldown}
          >
            <HandHeart className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </Button>
        </div>
      )}

      {/* Profile Image Viewer */}
      <ProfileImageViewer
        images={selectedImages}
        currentIndex={0}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
      />
    </div>
  );

  return (
    <div className="overflow-hidden">
      {isMobile ? (
        <MobilePullToRefresh onRefresh={handleRefresh} disabled={loading}>
          {content}
        </MobilePullToRefresh>
      ) : (
        content
      )}
    </div>
  );
});

DiscoverProfiles.displayName = 'DiscoverProfiles';

export default DiscoverProfiles;