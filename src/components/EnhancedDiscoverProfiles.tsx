import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SwipeableProfileCard from './mobile/SwipeableProfileCard';
import ProfileImageViewer from './ProfileImageViewer';
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';
import { useHaptics } from '@/hooks/useHaptics';
import { useRealtimePresence } from '@/hooks/useRealtimePresence';
import { Heart, RefreshCw } from 'lucide-react';
import MobilePullToRefresh from './mobile/MobilePullToRefresh';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { useDiscoverScrollPrevention } from '@/hooks/useDiscoverScrollPrevention';
import { useSimpleLikes } from '@/hooks/useSimpleLikes';
import DiscoverProfileFilters from './DiscoverProfileFilters';
import { analytics } from '@/lib/analytics';

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

const EnhancedDiscoverProfiles = React.memo(() => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [actionCooldown, setActionCooldown] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const { likeProfile, loading: likeLoading } = useSimpleLikes();
  
  const { vibrate } = useHaptics();
  const { isUserOnline } = useRealtimePresence();
  
  // Image viewer state
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // Prevent scroll issues on discover tab
  useDiscoverScrollPrevention({ 
    isDiscoverTab: true, 
    isCardFlipped 
  });

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
      setFilteredProfiles(discoveryProfiles || []);
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

  // Call fetchProfiles on mount
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const currentProfile = useMemo(() => {
    return filteredProfiles[currentIndex];
  }, [filteredProfiles, currentIndex]);

  const handleLikeProfile = useCallback(async (userId: string) => {
    if (actionCooldown || likeLoading) return;

    try {
      setActionCooldown(true);
      
      // Optimistic UI update - move to next profile immediately
      if (currentIndex < filteredProfiles.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (filteredProfiles.length === 0) {
        // No more profiles, try fetching new ones
        await fetchProfiles();
      }

      // Haptic feedback
      vibrate();

      // Track analytics
      analytics.track('profile_liked', { 
        liked_user_id: userId,
        source: 'enhanced_discover' 
      });

      // Like the profile
      await likeProfile(userId);

      console.log('Successfully liked profile:', userId);
      
    } catch (error: any) {
      console.error('Error liking profile:', error);
      
      // Revert optimistic update by going back to previous index
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
      
      toast({
        title: "Error liking profile",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setActionCooldown(false), 500);
    }
  }, [currentIndex, filteredProfiles.length, actionCooldown, likeLoading, vibrate, likeProfile, fetchProfiles, toast]);

  const passProfile = useCallback(async (userId: string) => {
    if (actionCooldown) return;

    try {
      setActionCooldown(true);
      
      // Optimistic UI update - move to next profile immediately
      if (currentIndex < filteredProfiles.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (filteredProfiles.length === 0) {
        // No more profiles, try fetching new ones
        await fetchProfiles();
      }

      // Track analytics
      analytics.track('profile_passed', { 
        passed_user_id: userId,
        source: 'enhanced_discover' 
      });

      // Record the pass in database
      const { error } = await supabase
        .from('passes')
        .insert({
          passer_id: user?.id,
          passed_id: userId
        });

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }

      console.log('Successfully passed profile:', userId);
      
    } catch (error: any) {
      console.error('Error passing profile:', error);
      
      // Revert optimistic update
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
      
      toast({
        title: "Error passing profile",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setActionCooldown(false), 500);
    }
  }, [currentIndex, filteredProfiles.length, actionCooldown, user?.id, fetchProfiles, toast]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilteredProfiles: Profile[]) => {
    setFilteredProfiles(newFilteredProfiles);
    setCurrentIndex(0);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchProfiles();
  }, [fetchProfiles]);

  const handleImageClick = useCallback((imageIndex: number) => {
    if (!currentProfile) return;
    
    const allImages = [
      ...(currentProfile.avatar_url ? [currentProfile.avatar_url] : []),
      ...(currentProfile.additional_photos || [])
    ];
    
    setSelectedImages(allImages);
    setImageViewerIndex(imageIndex);
    setImageViewerOpen(true);
  }, [currentProfile]);

  // Show loading state
  if (loading && profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-gray-600">Finding amazing people for you...</p>
      </div>
    );
  }

  // Show empty state with detailed information - updated for filtered results
  if (filteredProfiles.length === 0 || currentIndex >= filteredProfiles.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {profiles.length === 0 ? "You've seen everyone!" : "No matches with current filters"}
          </h3>
          <p className="text-gray-600 mb-4">
            {profiles.length === 0 
              ? "You've viewed all available profiles. Check back later for new members, or try adjusting your preferences."
              : "Try adjusting your filters to see more profiles, or clear them to see all available matches."
            }
          </p>
          
          {/* Show activity summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm">
            <h4 className="font-medium text-blue-900 mb-2">Your Activity:</h4>
            <p className="text-blue-700">You've interacted with most profiles in our community!</p>
            <p className="text-blue-600 text-xs mt-1">New profiles appear as people join MStwins.</p>
          </div>
          
          <div className="flex space-x-3 justify-center">
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
        paddingBottom: isMobile ? '8rem' : '8rem'
      }}
    >
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[70]">
        <DiscoverProfileFilters 
          profiles={profiles}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Main Profile Card Container - Perfectly centered */}
      <div className="flex-1 flex items-center justify-center px-4 pt-16">
        {currentProfile ? (
          <div className="relative w-full max-w-sm mx-auto flex items-center justify-center">
            <SwipeableProfileCard
              profile={currentProfile}
              onLike={handleLikeProfile}
              onPass={passProfile}
              onImageClick={handleImageClick}
              className="w-full"
            />
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
        <MobilePullToRefresh onRefresh={handleRefresh} disabled={loading || isCardFlipped}>
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