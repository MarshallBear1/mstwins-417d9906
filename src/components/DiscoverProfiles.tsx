import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Heart, RefreshCw, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { useDailyLikes } from "@/hooks/useDailyLikes";
import { analytics } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import ProfileImageViewer from "@/components/ProfileImageViewer";
import LikeLimitWarning from "@/components/LikeLimitWarning";
import MobileProfileCard from "@/components/ui/mobile-profile-card";
import { useHaptics } from "@/hooks/useHaptics";

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
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [actionCooldown, setActionCooldown] = useState(false);
  const [showSkippedProfiles, setShowSkippedProfiles] = useState(false);
  const { remainingLikes, refreshRemainingLikes } = useDailyLikes();
  const { vibrate } = useHaptics();
  const { isUserOnline } = useRealtimePresence();

  // Authentication guard - ensure user is authenticated before making queries
  const isAuthenticated = user && user.id && !authLoading;

  // Optimized profile fetching with authentication guard
  // Function to fetch skipped profiles
  const fetchSkippedProfiles = useCallback(async () => {
    if (!isAuthenticated) return;

    console.log('🔄 Fetching skipped profiles for user:', user.id);
    setLoading(true);
    
    try {
      const [passedResult] = await Promise.all([
        supabase
          .from('passes')
          .select('passed_id')
          .eq('passer_id', user.id)
      ]);

      if (passedResult.error) throw passedResult.error;

      const passedIds = passedResult.data?.map(pass => pass.passed_id) || [];
      
      if (passedIds.length === 0) {
        toast({
          title: "No skipped profiles",
          description: "You haven't skipped any profiles yet.",
        });
        setLoading(false);
        return;
      }

      const profilesResult = await supabase
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
          selected_prompts
        `)
        .in('user_id', passedIds)
        .eq('moderation_status', 'approved')
        .order('last_seen', { ascending: false });

      if (profilesResult.error) throw profilesResult.error;

      setProfiles(profilesResult.data as Profile[]);
      setCurrentIndex(0);
      setShowSkippedProfiles(true);
      
      toast({
        title: "Skipped profiles loaded",
        description: `Found ${profilesResult.data?.length || 0} previously skipped profiles.`,
      });
    } catch (error: any) {
      console.error('❌ Error fetching skipped profiles:', error);
      toast({
        title: "Error loading skipped profiles",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, toast]);

  const fetchProfiles = useCallback(async () => {
    // Authentication guard - don't proceed if user is not authenticated
    if (!isAuthenticated) {
      console.log('🚫 Cannot fetch profiles - user not authenticated');
      return;
    }

    console.log('🔄 Fetching discover profiles for authenticated user:', user.id);
    setLoading(true);
    setShowSkippedProfiles(false);
    
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
            selected_prompts
          `)
          .neq('user_id', user.id)
          .eq('moderation_status', 'approved')
          .order('last_seen', { ascending: false })
          .limit(200), // Increased limit significantly
        
        supabase
          .from('likes')
          .select('liked_id')
          .eq('liker_id', user.id),
        
        supabase
          .from('passes')
          .select('passed_id')
          .eq('passer_id', user.id)
      ]);

      console.log('📊 Profile query results:', {
        totalProfiles: profilesResult.data?.length || 0,
        likesCount: likedResult.data?.length || 0,
        passesCount: passedResult.data?.length || 0,
        hasError: !!profilesResult.error
      });

      if (profilesResult.error) {
        console.error('❌ Profile fetch error:', profilesResult.error);
        throw profilesResult.error;
      }

      const likedIds = new Set(likedResult.data?.map(like => like.liked_id) || []);
      const passedIds = new Set(passedResult.data?.map(pass => pass.passed_id) || []);

      console.log('🔍 Filtering profiles - Liked IDs:', likedIds.size, 'Passed IDs:', passedIds.size);

      // Filter out already liked/passed profiles
      const filteredProfiles = profilesResult.data?.filter(
        profile => !likedIds.has(profile.user_id) && !passedIds.has(profile.user_id)
      ) || [];

      console.log('✅ Filtered profiles count:', filteredProfiles.length);

      setProfiles(filteredProfiles as Profile[]);
      setCurrentIndex(0);
      
      if (filteredProfiles.length === 0) {
        console.log('⚠️ No profiles available after filtering');
      }
    } catch (error: any) {
      console.error('❌ Error fetching profiles:', error);
      
      // Enhanced error handling for authentication issues
      const errorMessage = error?.message || 'Unknown error';
      const isAuthError = errorMessage.includes('JWT') || 
                         errorMessage.includes('auth') || 
                         errorMessage.includes('unauthorized') ||
                         errorMessage.includes('invalid claim');
      
      if (isAuthError) {
        console.error('🔐 Authentication error detected:', errorMessage);
        toast({
          title: "Authentication Error",
          description: "Please refresh the page and try logging in again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error loading profiles",
          description: "Please try again later.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, toast]);

  // Initial load
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Memoized current profile calculation
  const currentProfile = useMemo(() => {
    return profiles[currentIndex] || null;
  }, [profiles, currentIndex]);

  // Optimized like function with cooldown and proper daily like checking
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

    setActionCooldown(true);
    setTimeout(() => setActionCooldown(false), 1000);

    try {
      // First check if user can like (daily limit) and increment counter
      const { data: canLike, error: limitError } = await supabase
        .rpc('check_and_increment_daily_likes', { target_user_id: profileUserId });

      if (limitError) {
        console.error('Error checking daily likes:', limitError);
        throw limitError;
      }

      if (!canLike) {
        toast({
          title: "Daily limit reached",
          description: "You've used all your likes for today. Come back tomorrow!",
          variant: "destructive"
        });
        refreshRemainingLikes(); // Refresh to show correct count
        return;
      }

      // Now insert the like
      const { error: likeError } = await supabase
        .from('likes')
        .insert({
          liker_id: user.id,
          liked_id: profileUserId
        });

      if (likeError) {
        // If it's a duplicate like error, show a friendlier message
        if (likeError.code === '23505') {
          toast({
            title: "Already liked",
            description: "You've already liked this profile!",
            variant: "destructive"
          });
          // Move to next profile even if duplicate
          setCurrentIndex(prev => prev + 1);
          refreshRemainingLikes();
          return;
        }
        throw likeError;
      }

      vibrate();
      analytics.track('profile_liked', { liked_user_id: profileUserId });
      
      // Move to next profile immediately for better UX
      setCurrentIndex(prev => prev + 1);
      refreshRemainingLikes();

      toast({
        title: "Profile liked!",
        description: "Your like has been sent."
      });
    } catch (error: any) {
      console.error('Error liking profile:', error);
      
      // More specific error messages
      if (error.message?.includes('daily limit') || error.message?.includes('limit reached')) {
        toast({
          title: "Daily limit reached",
          description: "You've used all your likes for today. Come back tomorrow!",
          variant: "destructive"
        });
      } else if (error.code === '23505') {
        toast({
          title: "Already liked",
          description: "You've already liked this profile!",
          variant: "destructive"
        });
        setCurrentIndex(prev => prev + 1);
      } else {
        toast({
          title: "Error liking profile",
          description: "Please try again later.",
          variant: "destructive"
        });
      }
      
      // Always refresh remaining likes on error to show correct count
      refreshRemainingLikes();
    }
  }, [user, actionCooldown, vibrate, refreshRemainingLikes, toast]);

  // Optimized pass function with cooldown
  const passProfile = useCallback(async (profileUserId: string) => {
    if (!user || actionCooldown) return;

    setActionCooldown(true);
    setTimeout(() => setActionCooldown(false), 1000);

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
      
      // Move to next profile immediately
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error passing profile:', error);
      toast({
        title: "Error passing profile",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  }, [user, actionCooldown, vibrate, toast]);

  // Memoized image click handler
  const handleImageClick = useCallback(() => {
    if (currentProfile?.additional_photos) {
      const images = [currentProfile.avatar_url, ...currentProfile.additional_photos].filter(Boolean) as string[];
      setSelectedImages(images);
      setImageViewerOpen(true);
    }
  }, [currentProfile]);

  // Show loading state for authentication or data fetching
  if (authLoading || (loading && profiles.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-gray-600">
          {authLoading ? 'Authenticating...' : 'Finding amazing people for you...'}
        </p>
      </div>
    );
  }

  // Show authentication required state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-600 mb-4">
            Please log in to discover profiles.
          </p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {showSkippedProfiles ? "No more skipped profiles" : "No more profiles to discover"}
          </h3>
          <p className="text-gray-600 mb-4">
            {showSkippedProfiles 
              ? "You've viewed all your skipped profiles."
              : "Check back later for new profiles or view your skipped ones."
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={fetchProfiles} className="bg-gradient-primary text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              {showSkippedProfiles ? "Back to New Profiles" : "Refresh"}
            </Button>
            {!showSkippedProfiles && (
              <Button onClick={fetchSkippedProfiles} variant="outline">
                See Skipped Profiles
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Remaining likes warning */}
      <LikeLimitWarning 
        open={remainingLikes <= 2 && remainingLikes > 0} 
        onOpenChange={() => {}} 
        remainingLikes={remainingLikes} 
      />
      {/* Mobile Profile Card - Better Centered */}
      {currentProfile && (
        <div className="flex justify-center items-center min-h-[600px] px-4">
          <div className="w-full max-w-[320px] mx-auto">
            <MobileProfileCard
              profile={{
                id: currentProfile.id,
                user_id: currentProfile.user_id,
                first_name: currentProfile.first_name,
                last_name: currentProfile.last_name,
                date_of_birth: currentProfile.date_of_birth || "",
                location: currentProfile.location,
                avatar_url: currentProfile.avatar_url || undefined,
                ms_subtype: currentProfile.ms_subtype || undefined,
                diagnosis_year: currentProfile.diagnosis_year || undefined,
                hobbies: currentProfile.hobbies || [],
                about_me: currentProfile.about_me || undefined,
                photos: [
                  ...(currentProfile.avatar_url ? [{ url: currentProfile.avatar_url }] : []),
                  ...(currentProfile.additional_photos?.map(url => ({ url })) || [])
                ],
                selected_prompts: currentProfile.selected_prompts || [],
                last_seen: currentProfile.last_seen
              }}
              onImageClick={handleImageClick}
              onLike={() => likeProfile(currentProfile.user_id)}
              onPass={() => passProfile(currentProfile.user_id)}
              isUserOnline={isUserOnline}
              className="mx-auto"
            />
          </div>
        </div>
      )}

      {/* Image viewer */}
      <ProfileImageViewer
        images={selectedImages}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        currentIndex={0}
      />
    </div>
  );
});

DiscoverProfiles.displayName = 'DiscoverProfiles';

export default DiscoverProfiles;