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
import SwipeableProfileCard from "@/components/mobile/SwipeableProfileCard";
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
  
  // Image viewer state
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

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

  // Enhanced like function with optimistic updates
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
    
    // Move to next profile immediately for better UX
    setCurrentIndex(prev => prev + 1);
    setIsCardFlipped(false);
    
    try {
      const success = await likeProfile(profileUserId);
      
      if (success) {
        vibrate();
        analytics.track('profile_liked', { liked_user_id: profileUserId });
        
        toast({
          title: "Connection sent! 🎉",
          description: "If they say hi back, you'll be connected!",
          duration: 3000,
        });
      } else {
        // Revert on failure
        setCurrentIndex(prev => prev - 1);
        return;
      }
      
    } catch (error) {
      console.error('❌ Error in handleLikeProfile:', error);
      setCurrentIndex(prev => prev - 1);
      toast({
        title: "Error",
        description: "Failed to send connection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setActionCooldown(false), 500);
    }
  }, [user, actionCooldown, likeProfile, vibrate, analytics, toast]);

  // Enhanced pass function with optimistic updates
  const passProfile = useCallback(async (profileUserId: string) => {
    if (!user || actionCooldown) return;

    setActionCooldown(true);
    
    // Move to next profile immediately for better UX
    setCurrentIndex(prev => prev + 1);
    setIsCardFlipped(false);

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
      setCurrentIndex(prev => prev - 1);
      
      toast({
        title: "Error passing profile",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setActionCooldown(false), 500);
    }
  }, [user, actionCooldown, vibrate, toast]);

  // Handle image clicks
  const handleImageClick = useCallback((imageIndex: number) => {
    if (currentProfile) {
      const images = [
        ...(currentProfile.avatar_url ? [currentProfile.avatar_url] : []),
        ...(currentProfile.additional_photos || [])
      ].filter(Boolean);
      
      setSelectedImages(images);
      setImageViewerIndex(imageIndex);
      setImageViewerOpen(true);
    }
  }, [currentProfile]);

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
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-xl border-0 ios-bounce hover:scale-105 transition-transform"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Main Profile Card Container - Moved down and centered */}
      <div className="flex-1 flex items-center justify-center px-4 pt-20">
        {currentProfile ? (
          <div className="relative w-full max-w-sm mx-auto">
            <SwipeableProfileCard
              profile={currentProfile}
              onLike={handleLikeProfile}
              onPass={passProfile}
              onImageClick={handleImageClick}
              className="mb-4"
            />
            
            {/* Next card preview */}
            {profiles[currentIndex + 1] && (
              <div 
                className="absolute inset-0 -z-10 pointer-events-none"
                style={{
                  transform: 'scale(0.95) translateY(12px)',
                  opacity: 0.4
                }}
              >
                <SwipeableProfileCard
                  profile={profiles[currentIndex + 1]}
                  onLike={() => {}}
                  onPass={() => {}}
                  className="pointer-events-none"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold mb-2">No more profiles</h2>
            <p className="text-gray-600 mb-4">Check back later for new matches!</p>
          </div>
        )}
      </div>

      {/* Profile Image Viewer */}
      <ProfileImageViewer
        images={selectedImages}
        currentIndex={imageViewerIndex}
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
