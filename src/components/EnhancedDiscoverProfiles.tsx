import { useState, useEffect, memo, useCallback, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, RefreshCw, MapPin, User, X, HandHeart, Sparkles, Filter } from "lucide-react";
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
import MobilePullToRefresh from "@/components/mobile/MobilePullToRefresh";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";

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

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 0.5;

const EnhancedDiscoverProfiles = memo(() => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { safeAreaInsets } = useMobileOptimizations();
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
  
  // Enhanced swipe gesture state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeIntensity, setSwipeIntensity] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startTime = useRef(0);

  const fetchProfiles = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('Fetching profiles for user:', user.id);

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

  const currentProfile = useMemo(() => {
    return profiles[currentIndex] || null;
  }, [profiles, currentIndex]);

  // Enhanced like function with better animation
  const handleLikeProfile = useCallback(async (profileUserId: string) => {
    if (!user || actionCooldown) return;

    if (user.id === profileUserId) {
      toast({
        title: "Can't connect with yourself",
        description: "You can't say hi to your own profile!",
        variant: "destructive"
      });
      return;
    }

    setActionCooldown(true);
    
    // Animate card away
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(100vw) rotate(30deg)';
      cardRef.current.style.transition = 'transform 0.3s ease-out';
    }
    
    // Move to next profile after animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsCardFlipped(false);
      if (cardRef.current) {
        cardRef.current.style.transform = '';
        cardRef.current.style.transition = '';
      }
    }, 300);
    
    try {
      console.log('🔄 Attempting to like profile:', profileUserId);
      
      const success = await likeProfile(profileUserId);
      
      if (success) {
        console.log('✅ Profile liked successfully');
        vibrate();
        analytics.track('profile_liked', { liked_user_id: profileUserId });
        
        // Show success feedback
        toast({
          title: "Connection sent! 🎉",
          description: "If they say hi back, you'll be connected!",
          duration: 3000,
        });
      } else {
        console.log('❌ Like failed');
        // Revert optimistic update
        setCurrentIndex(currentIndex);
        return;
      }
      
    } catch (error) {
      console.error('❌ Error in handleLikeProfile:', error);
      setCurrentIndex(currentIndex);
      toast({
        title: "Error",
        description: "Failed to send connection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setActionCooldown(false), 500);
    }
  }, [user, actionCooldown, currentIndex, likeProfile, vibrate, analytics, toast]);

  // Enhanced pass function
  const passProfile = useCallback(async (profileUserId: string) => {
    if (!user || actionCooldown) return;

    setActionCooldown(true);
    
    // Animate card away
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(-100vw) rotate(-30deg)';
      cardRef.current.style.transition = 'transform 0.3s ease-out';
    }
    
    // Move to next profile after animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsCardFlipped(false);
      if (cardRef.current) {
        cardRef.current.style.transform = '';
        cardRef.current.style.transition = '';
      }
    }, 300);

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

    } catch (error) {
      console.error('Error passing profile:', error);
      setCurrentIndex(currentIndex);
      
      toast({
        title: "Error passing profile",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setActionCooldown(false), 500);
    }
  }, [user, actionCooldown, vibrate, toast, currentIndex]);

  // Enhanced touch handlers with better feedback
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
    
    // Calculate swipe intensity for visual feedback
    const intensity = Math.min(Math.abs(deltaX) / 200, 1);
    setSwipeIntensity(intensity);
    
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
    
    const shouldSwipe = Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD;
    
    if (shouldSwipe) {
      if (deltaX > 0) {
        handleLikeProfile(currentProfile.user_id);
      } else {
        passProfile(currentProfile.user_id);
      }
    }
    
    // Reset swipe state
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
    setSwipeIntensity(0);
  }, [isDragging, actionCooldown, currentProfile, dragOffset.x, handleLikeProfile, passProfile]);

  const handleRefresh = useCallback(async () => {
    await fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Show loading state
  if (loading && profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-gray-600 animate-pulse">Finding amazing people for you...</p>
      </div>
    );
  }

  // Show empty state
  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            You've seen everyone!
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm">
            You've viewed all available profiles. Check back later for new members, or try adjusting your preferences.
          </p>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Your Activity:</h4>
            <p className="text-blue-700 text-sm">You've interacted with most profiles in our community!</p>
            <p className="text-blue-600 text-xs mt-1">New profiles appear as people join MStwins.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={fetchProfiles} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-full px-6 ios-bounce">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => {
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
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full px-6 ios-bounce"
            >
              See Skipped Profiles
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div 
      className="flex flex-col items-center justify-center min-h-[80vh] px-4 relative"
      style={{
        paddingBottom: isMobile ? `max(8rem, ${safeAreaInsets.bottom + 120}px)` : '8rem'
      }}
    >
      {/* Profile Counter */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg z-10">
        <span className="text-sm font-medium text-gray-700">
          {currentIndex + 1} of {profiles.length}
        </span>
      </div>

      {/* Filter Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border-0 ios-bounce"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Profile Card Stack */}
      {currentProfile && (
        <div className="relative w-full max-w-sm mx-auto">
          {/* Current Card */}
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
          >
            {/* Swipe indicators with enhanced feedback */}
            {isDragging && swipeDirection && (
              <div className="absolute inset-0 z-20 pointer-events-none">
                {swipeDirection === 'right' && (
                  <div 
                    className="absolute top-8 right-4 bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-xl transform rotate-12 transition-all duration-200"
                    style={{ opacity: swipeIntensity }}
                  >
                    <HandHeart className="w-5 h-5 inline mr-2" />
                    SAY HI!
                  </div>
                )}
                {swipeDirection === 'left' && (
                  <div 
                    className="absolute top-8 left-4 bg-red-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-xl transform -rotate-12 transition-all duration-200"
                    style={{ opacity: swipeIntensity }}
                  >
                    <X className="w-5 h-5 inline mr-2" />
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
          
          {/* Next card preview */}
          {profiles[currentIndex + 1] && (
            <div 
              className="absolute inset-0 -z-10"
              style={{
                transform: 'scale(0.95) translateY(8px)',
                opacity: 0.6
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

      {/* Enhanced Action Buttons */}
      {currentProfile && (
        <div className="flex justify-center items-center gap-8 mt-8">
          <Button
            onClick={() => passProfile(currentProfile.user_id)}
            size="lg"
            variant="outline"
            className="w-16 h-16 rounded-full border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 transition-all duration-200 group shadow-lg ios-bounce"
            disabled={actionCooldown}
          >
            <X className="w-6 h-6 text-gray-600 group-hover:text-red-500 transition-colors" />
          </Button>
          
          <Button
            onClick={() => handleLikeProfile(currentProfile.user_id)}
            size="lg"
            className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-110 group ios-bounce"
            disabled={actionCooldown}
          >
            <HandHeart className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
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
    <div className="overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen">
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

EnhancedDiscoverProfiles.displayName = 'EnhancedDiscoverProfiles';

export default EnhancedDiscoverProfiles;
