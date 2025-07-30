import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Heart, RefreshCw, User } from "lucide-react";
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

interface OptimizedDiscoverProfilesProps {
  profiles: Profile[];
  isLoading: boolean;
  onRefresh: () => void;
  onPreloadMore: () => void;
  hasMore: boolean;
}

const OptimizedDiscoverProfiles = ({ 
  profiles, 
  isLoading, 
  onRefresh, 
  onPreloadMore, 
  hasMore 
}: OptimizedDiscoverProfilesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [actionCooldown, setActionCooldown] = useState(false);
  const { remainingLikes, refreshRemainingLikes } = useDailyLikes();
  const { vibrate } = useHaptics();
  const { isUserOnline } = useRealtimePresence();

  // Auto-preload when near end
  useMemo(() => {
    if (profiles.length > 0 && currentIndex >= profiles.length - 3 && hasMore) {
      onPreloadMore();
    }
  }, [currentIndex, profiles.length, hasMore, onPreloadMore]);

  const currentProfile = useMemo(() => {
    return profiles[currentIndex] || null;
  }, [profiles, currentIndex]);

  const likeProfile = useCallback(async (profileUserId: string) => {
    if (!user || actionCooldown || !profileUserId) return;

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
      const { data: canLike, error: limitError } = await supabase
        .rpc('check_and_increment_daily_likes', { target_user_id: profileUserId });

      if (limitError) throw limitError;

      if (!canLike) {
        toast({
          title: "Daily limit reached",
          description: "You've used all your likes for today. Come back tomorrow!",
          variant: "destructive"
        });
        refreshRemainingLikes();
        return;
      }

      const { error: likeError } = await supabase
        .from('likes')
        .insert({
          liker_id: user.id,
          liked_id: profileUserId
        });

      if (likeError) {
        if (likeError.code === '23505') {
          toast({
            title: "Already liked",
            description: "You've already liked this profile!",
            variant: "destructive"
          });
          setCurrentIndex(prev => prev + 1);
          refreshRemainingLikes();
          return;
        }
        throw likeError;
      }

      vibrate();
      analytics.track('profile_liked', { liked_user_id: profileUserId });
      
      setCurrentIndex(prev => prev + 1);
      refreshRemainingLikes();

      toast({
        title: "Profile liked!",
        description: "Your like has been sent."
      });
    } catch (error: any) {
      console.error('Error liking profile:', error);
      
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
      
      refreshRemainingLikes();
    }
  }, [user, actionCooldown, vibrate, refreshRemainingLikes, toast]);

  const passProfile = useCallback(async (profileUserId: string) => {
    if (!user || actionCooldown || !profileUserId) {
      console.warn('Cannot pass profile: missing user, cooldown active, or invalid profile ID');
      return;
    }

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

  const handleImageClick = useCallback(() => {
    if (currentProfile?.additional_photos) {
      const images = [currentProfile.avatar_url, ...currentProfile.additional_photos].filter(Boolean) as string[];
      setSelectedImages(images);
      setImageViewerOpen(true);
    }
  }, [currentProfile]);

  if (isLoading && profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-gray-600">Finding amazing people for you...</p>
      </div>
    );
  }

  if (!user) {
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

  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No more profiles to discover
          </h3>
          <p className="text-gray-600 mb-4">
            Check back later for new profiles.
          </p>
          <Button onClick={onRefresh} className="bg-gradient-primary text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <LikeLimitWarning 
        open={remainingLikes <= 2 && remainingLikes > 0} 
        onOpenChange={() => {}} 
        remainingLikes={remainingLikes} 
      />
      
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
              onLike={() => currentProfile?.user_id && likeProfile(currentProfile.user_id)}
              onPass={() => currentProfile?.user_id && passProfile(currentProfile.user_id)}
              isUserOnline={isUserOnline}
              className="mx-auto"
            />
          </div>
        </div>
      )}

      <ProfileImageViewer
        images={selectedImages}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        currentIndex={0}
      />
    </div>
  );
};

export default OptimizedDiscoverProfiles;