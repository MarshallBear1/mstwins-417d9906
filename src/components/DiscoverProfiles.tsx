import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, RefreshCw, MapPin, User } from "lucide-react";
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
}

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4">
      {/* Profile Card */}
      {currentProfile && (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-[300px]">
            <DiscoverProfileCard 
              profile={currentProfile} 
              isFlipped={isCardFlipped}
              onFlipChange={setIsCardFlipped}
            />
            
            {/* Action Buttons */}
            <div className="flex space-x-3 w-full max-w-[300px] mt-4">
              <Button
                onClick={() => passProfile(currentProfile.user_id)}
                variant="outline"
                className="flex-1"
                disabled={actionCooldown}
              >
                Pass
              </Button>
              <Button
                onClick={() => handleLikeProfile(currentProfile.user_id)}
                className="flex-1 bg-gradient-primary text-white"
                disabled={actionCooldown}
              >
                <Heart className="w-4 h-4 mr-2" />
                Like
              </Button>
            </div>
          </div>
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

  return isMobile ? (
    <MobilePullToRefresh onRefresh={handleRefresh} disabled={loading}>
      {content}
    </MobilePullToRefresh>
  ) : (
    content
  );
});

DiscoverProfiles.displayName = 'DiscoverProfiles';

export default DiscoverProfiles;