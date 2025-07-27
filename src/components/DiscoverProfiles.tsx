import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { useDailyLikes } from "@/hooks/useDailyLikes";
import { analytics } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import ProfileImageViewer from "@/components/ProfileImageViewer";
import LikeLimitWarning from "@/components/LikeLimitWarning";
import { useNativeCapabilities } from "@/hooks/useNativeCapabilities";
import { MobileProfileCard } from "@/components/ui/mobile-profile-card";


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
  selected_prompts?: {
    question: string;
    answer: string;
  }[];
  extended_profile_completed?: boolean;
}

const DiscoverProfiles = () => {
  const { user } = useAuth();
  const { isUserOnline, getLastSeenText } = useRealtimePresence();
  const { remainingLikes, refreshRemainingLikes, isLimitEnforced, shouldShowWarning, hasUnlimitedLikes } = useDailyLikes();
  const { toast } = useToast();
  const { enhancedLikeAction, enhancedButtonPress, enhancedErrorAction, enhancedSuccessAction } = useNativeCapabilities();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showingSkipped, setShowingSkipped] = useState(false);
  const [showMatchAnnouncement, setShowMatchAnnouncement] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (showingSkipped) {
        // Get profiles that were previously passed on, but exclude current matches and likes
        console.log('🔍 Fetching skipped profiles...');
        
        const { data: passedProfiles } = await supabase
          .from('passes')
          .select('passed_id')
          .eq('passer_id', user.id);

        if (passedProfiles && passedProfiles.length > 0) {
          const passedIds = passedProfiles.map(p => p.passed_id);
          
          // Get current matches and likes to exclude them from skipped profiles
          const { data: existingMatches } = await supabase
            .from('matches')
            .select('user1_id, user2_id')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

          const { data: existingLikes } = await supabase
            .from('likes')
            .select('liked_id')
            .eq('liker_id', user.id);

          const matchedIds = existingMatches?.map(match => 
            match.user1_id === user.id ? match.user2_id : match.user1_id
          ) || [];
          const likedIds = existingLikes?.map(like => like.liked_id) || [];
          
          // Only show skipped profiles that aren't now matched or liked
          const availableSkippedIds = passedIds.filter(id => 
            !matchedIds.includes(id) && !likedIds.includes(id)
          );

          console.log('📝 Skipped profiles data:', {
            totalPassed: passedIds.length,
            matchedIds: matchedIds.length,
            likedIds: likedIds.length,
            availableSkipped: availableSkippedIds.length
          });
          
          if (availableSkippedIds.length > 0) {
            const { data: skippedProfiles } = await supabase
              .from('profiles')
              .select('*')
              .in('user_id', availableSkippedIds);
            
            console.log(`✅ Found ${skippedProfiles?.length || 0} available skipped profiles`);
            setProfiles((skippedProfiles || []).map(profile => ({
              ...profile,
              selected_prompts: Array.isArray(profile.selected_prompts) ? profile.selected_prompts as { question: string; answer: string; }[] : []
            })));
          } else {
            console.log('📭 No skipped profiles available (all are now matched or liked)');
            setProfiles([]);
          }
        } else {
          console.log('📭 No passed profiles found');
          setProfiles([]);
        }
      } else {
        // Get profiles excluding current user, people already liked/passed, and matched users
        console.log('🔍 Fetching profiles excluding matches, likes, and passes...');
        
        const { data: existingLikes } = await supabase
          .from('likes')
          .select('liked_id')
          .eq('liker_id', user.id);

        const { data: existingMatches } = await supabase
          .from('matches')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

        const { data: existingPasses } = await supabase
          .from('passes')
          .select('passed_id')
          .eq('passer_id', user.id);

        const likedIds = existingLikes?.map(like => like.liked_id) || [];
        const matchedIds = existingMatches?.map(match => 
          match.user1_id === user.id ? match.user2_id : match.user1_id
        ) || [];
        const passedIds = existingPasses?.map(pass => pass.passed_id) || [];
        
        const excludedIds = [...likedIds, ...matchedIds, ...passedIds, user.id];
        
        console.log('📝 Exclusion data:', {
          likedIds: likedIds.length,
          matchedIds: matchedIds.length,
          passedIds: passedIds.length,
          totalExcluded: excludedIds.length
        });
        
        let query = supabase
          .from('profiles')
          .select('*');

        // Properly handle exclusions - don't apply filter if no exclusions
        if (excludedIds.length > 0) {
          query = query.not('user_id', 'in', `(${excludedIds.join(',')})`);
        } else {
          // Just exclude current user if no other exclusions
          query = query.neq('user_id', user.id);
        }

        // Order by last_seen to prioritize recently online users, then by random
        const { data, error } = await query
          .order('last_seen', { ascending: false, nullsFirst: false })
          .limit(50); // Increase limit to ensure good variety

        if (error) {
          console.error('Error fetching profiles:', error);
          return;
        }

        console.log(`✅ Found ${data?.length || 0} available profiles`);
        setProfiles((data || []).map(profile => ({
          ...profile,
          selected_prompts: Array.isArray(profile.selected_prompts) ? profile.selected_prompts as { question: string; answer: string; }[] : []
        })));
      }
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleLike = async () => {
    if (!user || !currentProfile || actionLoading) return;
    
    // Show warning before like action when user has 4 likes remaining
    if (shouldShowWarning()) {
      setShowLimitWarning(true);
    }
    
    // Add haptic feedback for like action
    await enhancedLikeAction();
    
    // Check daily like limit before proceeding
    if (isLimitEnforced() && remainingLikes <= 0) {
      await enhancedErrorAction();
      toast({
        title: "Daily Like Limit Reached",
        description: "You've reached your daily limit of 10 likes. Come back tomorrow for more!",
        variant: "destructive",
      });
      return;
    }
    
    setActionLoading(true);
    
    // Track profile like
    analytics.profileLiked(user.id, currentProfile.user_id);
    
    console.log('🚀 Starting like process for profile:', currentProfile.user_id);
    
    try {
      // Check and increment daily likes using the database function
      const { data: canLike, error: limitError } = await supabase.rpc('check_and_increment_daily_likes', {
        target_user_id: currentProfile.user_id
      });
      
      if (limitError) {
        console.error('❌ Error checking like limit:', limitError);
        throw limitError;
      }
      
      if (!canLike) {
        await enhancedErrorAction();
        toast({
          title: "Daily Like Limit Reached",
          description: "You've reached your daily limit of 10 likes. Come back tomorrow for more!",
          variant: "destructive",
        });
        setActionLoading(false);
        return;
      }
      
      // Check if this will create a match
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('liker_id', currentProfile.user_id)
        .eq('liked_id', user.id)
        .maybeSingle();

      const willCreateMatch = !!existingLike;
      console.log('📊 Will create match:', willCreateMatch);

      // Insert the like
      const { data: newLike, error } = await supabase
        .from('likes')
        .insert({
          liker_id: user.id,
          liked_id: currentProfile.user_id
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating like:', error);
        throw error;
      }

      console.log('✅ Like created successfully:', newLike);
      
      // Refresh remaining likes count
      refreshRemainingLikes();

      // Send email notifications in background (non-blocking for speed)
      supabase.functions.invoke('email-notification-worker', {
        body: {
          type: willCreateMatch ? 'match' : 'like',
          likerUserId: user.id,
          likedUserId: currentProfile.user_id
        }
      }).then(() => {
        console.log('✅ Email notification sent successfully');
      }).catch((emailError) => {
        console.error('❌ Error sending email notification:', emailError);
      });

      // Show match announcement if it's a match
      if (willCreateMatch) {
        await enhancedSuccessAction(); // Enhanced haptic for match
        setShowMatchAnnouncement(true);
        setTimeout(() => setShowMatchAnnouncement(false), 4000);
        console.log('🎉 Match announcement shown!');
      } else {
        await enhancedSuccessAction(); // Success haptic for like
      }

      // IMPORTANT: Move to next profile AFTER like is successfully processed
      handleNext();

    } catch (error) {
      console.error('❌ Error in like process:', error);
      await enhancedErrorAction();
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      console.log('🔄 Like process completed, actionLoading set to false');
    }
  };

  const handlePass = async () => {
    if (!user || !currentProfile || actionLoading) return;
    
    // Add haptic feedback for pass action
    await enhancedButtonPress();
    
    console.log('⏭️ Starting pass process for profile:', currentProfile.user_id);
    setActionLoading(true);
    
    try {
      // Track profile pass
      analytics.profilePassed(user.id, currentProfile.user_id);
      
      
      if (!showingSkipped) {
        // Record the pass in the database
        const { error } = await supabase
          .from('passes')
          .insert({
            passer_id: user.id,
            passed_id: currentProfile.user_id
          });

        if (error) {
          console.error('❌ Error recording pass:', error);
        } else {
          console.log('✅ Pass recorded successfully');
        }
      }
      
      // Move to next profile immediately for seamless experience
      handleNext();
      setActionLoading(false);
      
    } catch (error) {
      console.error('❌ Error recording pass:', error);
      setActionLoading(false);
    }
    
    console.log('⏭️ Pass process completed');
  };

  const handleNext = () => {
    // Immediately move to next profile for snappiness
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // No more profiles, fetch new ones
      fetchProfiles();
    }
  };

  const currentProfile = profiles[currentIndex];

  const openImageViewer = (imageIndex: number) => {
    setImageViewerIndex(imageIndex);
    setShowImageViewer(true);
  };

  // Prepare all images for the viewer
  const allImages = currentProfile ? [
    ...(currentProfile.avatar_url ? [currentProfile.avatar_url] : []),
    ...(currentProfile.additional_photos || [])
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="p-6 text-center">
        <div className="mb-8">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Discover Community</h2>
          <p className="text-muted-foreground">Find supportive connections in the MS community</p>
        </div>
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-muted-foreground mb-4">
                No new profiles to discover right now.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                More profiles will appear as new users join the MS<span className="text-blue-600">Twins</span> community. Check back later to find your perfect matches!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={fetchProfiles}
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Profiles
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newSkippedState = !showingSkipped;
                    setShowingSkipped(newSkippedState);
                    setCurrentIndex(0); // Reset to first profile
                    // If switching to skipped view, auto-fetch skipped profiles
                    if (newSkippedState) {
                      setTimeout(() => {
                        fetchProfiles();
                      }, 100);
                    } else {
                      setTimeout(() => {
                        fetchProfiles();
                      }, 100);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  {showingSkipped ? 'Back to Discovery' : 'Review Skipped Profiles'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasExtendedContent = currentProfile.additional_photos?.length || 
                           currentProfile.selected_prompts?.length || 
                           currentProfile.medications?.length || 
                           currentProfile.symptoms?.length;

  return (
    <div className="mobile-safe-x mobile-safe-bottom pt-8 pb-6 px-3 sm:p-6">
      {/* Match Announcement Modal */}
      {showMatchAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 text-center max-w-sm w-full mx-4 shadow-2xl animate-scale-in">
            <div className="mb-6">
              <img 
                src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                alt="MSTwins mascot" 
                className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 animate-bounce"
              />
              <h2 className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">🎉 It's a Match!</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                You and {currentProfile?.first_name} {currentProfile?.last_name} liked each other! Start chatting now.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShowMatchAnnouncement(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm sm:text-base mobile-touch-target"
              >
                Continue Discovering
              </button>
              <button 
                onClick={() => {
                  setShowMatchAnnouncement(false);
                  // Navigate to matches tab (you'd need to pass this function down from parent)
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
              >
                Start Chatting
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileProfileCard
        profile={currentProfile}
        onImageClick={openImageViewer}
        isUserOnline={isUserOnline}
        getLastSeenText={getLastSeenText}
        showActions={true}
        onLike={handleLike}
        onPass={handlePass}
        actionLoading={actionLoading}
        className="animate-scale-in"
      />

      {/* Profile Image Viewer */}
      <ProfileImageViewer 
        images={allImages}
        currentIndex={imageViewerIndex}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
      />

      {/* Like Limit Warning Dialog */}
      <LikeLimitWarning 
        open={showLimitWarning}
        onOpenChange={setShowLimitWarning}
        remainingLikes={remainingLikes}
      />

    </div>
  );
};

export default DiscoverProfiles;