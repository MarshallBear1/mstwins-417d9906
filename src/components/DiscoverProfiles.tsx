import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, RefreshCw, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { useDailyLikesReferral } from "@/hooks/useDailyLikesReferral";
import { useDailyLikes } from "@/hooks/useDailyLikes";
import { analytics } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import ProfileImageViewer from "@/components/ProfileImageViewer";
import LikeLimitWarning from "@/components/LikeLimitWarning";
import { useHaptics } from "@/hooks/useHaptics";
import DiscoverProfileCard from "@/components/DiscoverProfileCard";

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
  selected_prompts?: any;
}

const DiscoverProfiles = memo(() => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [actionCooldown, setActionCooldown] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [showLikeLimitWarning, setShowLikeLimitWarning] = useState(false);
  const { remainingLikes, refreshRemainingLikes, likesData } = useDailyLikes();
  const { canGetBonus } = useDailyLikesReferral();
  const { vibrate } = useHaptics();
  const { isUserOnline } = useRealtimePresence();

  // Optimized profile fetching with improved mixed algorithm
  const fetchProfiles = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      const [profilesResult, likedResult, passedResult] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            first_name,
            last_name,
            date_of_birth,
            location,
            gender,
            ms_subtype,
            diagnosis_year,
            symptoms,
            medications,
            hobbies,
            avatar_url,
            about_me,
            last_seen,
            additional_photos,
            selected_prompts,
            moderation_status,
            hide_from_discover
          `)
          .neq('user_id', user.id)
          .eq('moderation_status', 'approved')
          .neq('hide_from_discover', true)
          .limit(1000), // Much higher limit to ensure all profiles are available
        
        supabase
          .from('likes')
          .select('liked_id')
          .eq('liker_id', user.id),
        
        supabase
          .from('passes')
          .select('passed_id')
          .eq('passer_id', user.id)
      ]);

      if (profilesResult.error) throw profilesResult.error;

      const likedIds = new Set(likedResult.data?.map(like => like.liked_id) || []);
      const passedIds = new Set(passedResult.data?.map(pass => pass.passed_id) || []);
      
      // Filter out already liked/passed profiles and exclude MStwins related profiles
      const filteredProfiles = profilesResult.data?.filter(profile => {
        const isLiked = likedIds.has(profile.user_id);
        const isPassed = passedIds.has(profile.user_id);
        
        // Filter out MStwins related profiles by checking name patterns
        const isMstwins = profile.first_name?.toLowerCase().includes('mstwins') || 
                         profile.last_name?.toLowerCase().includes('mstwins') ||
                         profile.first_name?.toLowerCase() === 'mstwins' || 
                         profile.last_name?.toLowerCase() === 'mstwins' ||
                         (profile.first_name?.toLowerCase() === 'ms' && profile.last_name?.toLowerCase() === 'twins');
        
        return !isLiked && !isPassed && !isMstwins;
      }) || [];

      // Improved algorithm: Mix recently active and less active users
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      // Categorize profiles by activity
      const recentlyActive = filteredProfiles.filter(profile => 
        profile.last_seen && new Date(profile.last_seen) > oneDayAgo
      );
      
      const moderatelyActive = filteredProfiles.filter(profile => 
        profile.last_seen && 
        new Date(profile.last_seen) <= oneDayAgo && 
        new Date(profile.last_seen) > threeDaysAgo
      );
      
      const lessActive = filteredProfiles.filter(profile => 
        !profile.last_seen || new Date(profile.last_seen) <= threeDaysAgo
      );

      // Shuffle each category to add randomness
      const shuffleArray = (array: Profile[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const shuffledRecent = shuffleArray(recentlyActive);
      const shuffledModerate = shuffleArray(moderatelyActive);
      const shuffledLess = shuffleArray(lessActive);

      // Create mixed array: 60% recent, 25% moderate, 15% less active
      const mixedProfiles: Profile[] = [];
      
      // Calculate total available profiles
      const totalAvailable = shuffledRecent.length + shuffledModerate.length + shuffledLess.length;
      
      let recentIndex = 0, moderateIndex = 0, lessIndex = 0;
      
      // Include ALL available profiles, not just a limited subset
      for (let i = 0; i < totalAvailable; i++) {
        // Determine which category to pick from based on weighted distribution
        const rand = Math.random();
        
        if (rand < 0.6 && recentIndex < shuffledRecent.length) {
          // 60% chance for recently active
          mixedProfiles.push(shuffledRecent[recentIndex++]);
        } else if (rand < 0.85 && moderateIndex < shuffledModerate.length) {
          // 25% chance for moderately active  
          mixedProfiles.push(shuffledModerate[moderateIndex++]);
        } else if (lessIndex < shuffledLess.length) {
          // 15% chance for less active
          mixedProfiles.push(shuffledLess[lessIndex++]);
        } else {
          // Fallback: add from any available category
          if (recentIndex < shuffledRecent.length) {
            mixedProfiles.push(shuffledRecent[recentIndex++]);
          } else if (moderateIndex < shuffledModerate.length) {
            mixedProfiles.push(shuffledModerate[moderateIndex++]);
          } else if (lessIndex < shuffledLess.length) {
            mixedProfiles.push(shuffledLess[lessIndex++]);
          }
        }
      }

      setProfiles(mixedProfiles);
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

  // Show like limit warning when likes are low
  useEffect(() => {
    if (remainingLikes <= 2 && remainingLikes > 0) {
      setShowLikeLimitWarning(true);
    }
  }, [remainingLikes]);

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
  const likeProfile = useCallback(async (profileUserId: string) => {
    if (!user || actionCooldown) return;

    if (user.id === profileUserId) {
      toast({
        title: "Can't like yourself",
        description: "You can't like your own profile!",
        variant: "destructive"
      });
      return;
    }

    if (remainingLikes <= 0) {
      toast({
        title: "No likes remaining",
        description: "You've used all your likes for today. Come back tomorrow!",
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
      console.log('🔢 Current remaining likes (frontend):', remainingLikes);
      
      // First check and increment daily like count (this enforces the limit)
      const { data: canLike, error: limitError } = await supabase.rpc('check_and_increment_daily_likes', {
        target_user_id: profileUserId
      });

      console.log('✅ Like limit check result:', { canLike, limitError });

      if (limitError) throw limitError;

      if (!canLike) {
        console.log('❌ Like limit reached - blocking like');
        toast({
          title: "Daily limit reached",
          description: "You've reached your daily like limit. Try tomorrow or share to get bonus likes!",
          variant: "destructive"
        });
        // Revert optimistic update
        setCurrentIndex(currentIndex);
        return;
      }

      // Now insert the actual like record
      const { error } = await supabase
        .from('likes')
        .insert({
          liker_id: user.id,
          liked_id: profileUserId
        });

      if (error) throw error;

      vibrate();
      analytics.track('profile_liked', { liked_user_id: profileUserId });
      refreshRemainingLikes();

      toast({
        title: "Profile liked!",
        description: "Your like has been sent."
      });
    } catch (error: any) {
      console.error('Error liking profile:', error);
      // Revert optimistic update on error
      setCurrentIndex(currentIndex);
      
      toast({
        title: "Error liking profile",
        description: error.message === 'Users cannot like their own profile' 
          ? "You can't like your own profile!" 
          : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setActionCooldown(false), 500); // Reduced cooldown
    }
  }, [user, actionCooldown, remainingLikes, vibrate, refreshRemainingLikes, toast, currentIndex]);

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
  const handleImageClick = useCallback(() => {
    if (currentProfile?.additional_photos) {
      const images = [currentProfile.avatar_url, ...currentProfile.additional_photos].filter(Boolean) as string[];
      setSelectedImages(images);
      setImageViewerOpen(true);
    }
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4">
      {/* Remaining likes warning */}
      <LikeLimitWarning 
        open={showLikeLimitWarning} 
        onOpenChange={setShowLikeLimitWarning} 
        remainingLikes={remainingLikes} 
      />
      
      {/* Compact Profile Card */}
      {currentProfile && (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-[300px]"> {/* Fixed width container */}
            <DiscoverProfileCard 
              profile={currentProfile} 
              isFlipped={isCardFlipped}
              onFlipChange={setIsCardFlipped}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3 w-full max-w-[300px]">
            <Button
              onClick={() => passProfile(currentProfile.user_id)}
              variant="outline"
              className="flex-1"
              disabled={actionCooldown}
            >
              Pass
            </Button>
            <Button
              onClick={() => likeProfile(currentProfile.user_id)}
              className="flex-1 bg-gradient-primary text-white"
              disabled={actionCooldown || remainingLikes <= 0}
            >
              <Heart className="w-4 h-4 mr-2" />
              Like
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

DiscoverProfiles.displayName = 'DiscoverProfiles';

export default DiscoverProfiles;