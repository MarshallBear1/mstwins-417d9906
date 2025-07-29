import { useState, useEffect, memo } from "react";
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
import MobileProfileCard from "@/components/ui/mobile-profile-card";


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

  // Preload next profile images for faster loading
  useEffect(() => {
    const preloadImages = () => {
      // Preload the next 3 profiles' images
      for (let i = currentIndex + 1; i <= Math.min(currentIndex + 3, profiles.length - 1); i++) {
        const profile = profiles[i];
        if (profile) {
          // Preload avatar
          if (profile.avatar_url) {
            const img = new Image();
            img.src = profile.avatar_url;
          }
          
          // Preload additional photos
          if (profile.additional_photos) {
            profile.additional_photos.slice(0, 4).forEach(photoUrl => {
              const img = new Image();
              img.src = photoUrl;
            });
          }
        }
      }
    };

    if (profiles.length > 0 && currentIndex >= 0) {
      preloadImages();
    }
  }, [profiles, currentIndex]);

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
        // Optimized query for skipped profiles - get all excluded IDs first
        console.log('🔍 Fetching skipped profiles with optimized approach...');
        
        // Get passed profiles and exclusions in parallel
        const [passedResult, likesResult, matchesResult] = await Promise.all([
          supabase.from('passes').select('passed_id').eq('passer_id', user.id),
          supabase.from('likes').select('liked_id').eq('liker_id', user.id),
          supabase.from('matches').select('user1_id, user2_id').or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        ]);

        const passedIds = passedResult.data?.map(p => p.passed_id) || [];
        const likedIds = likesResult.data?.map(l => l.liked_id) || [];
        const matchedIds = matchesResult.data?.map(m => 
          m.user1_id === user.id ? m.user2_id : m.user1_id
        ) || [];
        
        // Only show skipped profiles that aren't now matched or liked
        const availableSkippedIds = passedIds.filter(id => 
          !matchedIds.includes(id) && !likedIds.includes(id)
        );

        if (availableSkippedIds.length > 0) {
          const { data: skippedProfiles, error } = await supabase
            .from('profiles')
            .select('*')
            .in('user_id', availableSkippedIds);
          
          if (error) {
            console.error('Error fetching skipped profiles:', error);
            setProfiles([]);
          } else {
            console.log(`✅ Found ${skippedProfiles?.length || 0} available skipped profiles`);
            setProfiles((skippedProfiles || []).map(profile => ({
              ...profile,
              selected_prompts: Array.isArray(profile.selected_prompts) ? profile.selected_prompts as { question: string; answer: string; }[] : []
            })));
          }
        } else {
          console.log('📭 No skipped profiles available');
          setProfiles([]);
        }
      } else {
        // Optimized query for new profiles - parallel fetch of exclusions
        console.log('🔍 Fetching new profiles with optimized parallel queries...');
        
        // Fetch all exclusion data in parallel (3 queries → 1 parallel batch)
        const [likesResult, matchesResult, passesResult] = await Promise.all([
          supabase.from('likes').select('liked_id').eq('liker_id', user.id),
          supabase.from('matches').select('user1_id, user2_id').or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
          supabase.from('passes').select('passed_id').eq('passer_id', user.id)
        ]);

        const likedIds = likesResult.data?.map(l => l.liked_id) || [];
        const matchedIds = matchesResult.data?.map(m => 
          m.user1_id === user.id ? m.user2_id : m.user1_id
        ) || [];
        const passedIds = passesResult.data?.map(p => p.passed_id) || [];
        
        const excludedIds = [...likedIds, ...matchedIds, ...passedIds, user.id];
        
        console.log('📝 Optimized exclusion data:', {
          likedIds: likedIds.length,
          matchedIds: matchedIds.length, 
          passedIds: passedIds.length,
          totalExcluded: excludedIds.length
        });

        // Fetch recently active profiles (within 2 days)
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        let recentQuery = supabase.from('profiles').select('*');
        let olderQuery = supabase.from('profiles').select('*');
        
        if (excludedIds.length > 1) {
          recentQuery = recentQuery.not('user_id', 'in', `(${excludedIds.join(',')})`);
          olderQuery = olderQuery.not('user_id', 'in', `(${excludedIds.join(',')})`);
        } else {
          recentQuery = recentQuery.neq('user_id', user.id);
          olderQuery = olderQuery.neq('user_id', user.id);
        }

        // Get recently active profiles (last 2 days)
        const recentProfiles = await recentQuery
          .gte('last_seen', twoDaysAgo.toISOString())
          .order('last_seen', { ascending: false })
          .limit(25);

        // Get older profiles (2+ days ago or null)
        const olderProfiles = await olderQuery
          .or(`last_seen.lt.${twoDaysAgo.toISOString()},last_seen.is.null`)
          .order('last_seen', { ascending: false, nullsFirst: true })
          .limit(25);

        if (recentProfiles.error || olderProfiles.error) {
          console.error('Error fetching profiles:', recentProfiles.error || olderProfiles.error);
          return;
        }

        // Mix profiles: alternate between recent and older
        const mixedProfiles: any[] = [];
        const recentList = recentProfiles.data || [];
        const olderList = olderProfiles.data || [];
        
        const maxLength = Math.max(recentList.length, olderList.length);
        for (let i = 0; i < maxLength; i++) {
          if (i < recentList.length) {
            mixedProfiles.push(recentList[i]);
          }
          if (i < olderList.length) {
            mixedProfiles.push(olderList[i]);
          }
        }

        console.log(`✅ Mixed discovery: ${recentList.length} recent + ${olderList.length} older = ${mixedProfiles.length} total profiles`);

        const processedProfiles = mixedProfiles.map(profile => ({
          ...profile,
          selected_prompts: Array.isArray(profile.selected_prompts) ? profile.selected_prompts as { question: string; answer: string; }[] : []
        }));
        
        setProfiles(processedProfiles);
      }
      
      console.log('📊 Setting currentIndex to 0');
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
    
    // Check daily like limit before proceeding (local check first)
    if (isLimitEnforced() && remainingLikes <= 0) {
      enhancedErrorAction(); // Non-blocking
      toast({
        title: "Daily Like Limit Reached",
        description: "You've reached your daily limit of 10 likes. Come back tomorrow for more!",
        variant: "destructive",
      });
      return;
    }
    
    setActionLoading(true);
    
    // OPTIMISTIC UI UPDATE - Move to next profile immediately for speed
    const profileToLike = currentProfile; // Store reference before moving
    handleNext(); // Move UI immediately
    
    // Non-blocking haptic feedback and analytics
    enhancedLikeAction(); // Remove await for speed
    analytics.profileLiked(user.id, profileToLike.user_id);
    
    console.log('🚀 Starting like process for profile:', profileToLike.user_id);
    
         // Background processing - don't block UI
     Promise.resolve().then(async () => {
       try {
         // Parallel operations for speed
         const [canLikeResult, existingLikeResult] = await Promise.all([
           // Check like limit
           supabase.rpc('check_and_increment_daily_likes', {
             target_user_id: profileToLike.user_id
           }),
           // Check for existing like (for match detection)
           supabase
             .from('likes')
             .select('*')
             .eq('liker_id', profileToLike.user_id)
             .eq('liked_id', user.id)
             .maybeSingle()
         ]);
         
         const { data: canLike, error: limitError } = canLikeResult;
         const { data: existingLike } = existingLikeResult;
         
         if (limitError || !canLike) {
           console.error('❌ Like limit reached:', limitError);
           toast({
             title: "Daily Like Limit Reached",
             description: "You've reached your daily limit of 10 likes. Come back tomorrow for more!",
             variant: "destructive",
           });
           return;
         }

         const willCreateMatch = !!existingLike;
         console.log('📊 Will create match:', willCreateMatch);

         // Insert the like (non-blocking for UI)
         const { error: insertError } = await supabase
           .from('likes')
           .insert({
             liker_id: user.id,
             liked_id: profileToLike.user_id
           });

         if (insertError) {
           console.error('❌ Error creating like:', insertError);
           return;
         }

         console.log('✅ Like processed successfully');
         
         // Update remaining likes count in background
         refreshRemainingLikes();

         // Background email notifications (completely non-blocking)
         supabase.functions.invoke('email-notification-worker', {
           body: {
             type: willCreateMatch ? 'match' : 'like',
             likerUserId: user.id,
             likedUserId: profileToLike.user_id
           }
         }).catch((emailError) => {
           console.error('❌ Email notification error (non-critical):', emailError);
         });

         // Show match notification if it's a match
         if (willCreateMatch) {
           enhancedSuccessAction(); // Non-blocking haptic
           toast({
             title: "🎉 It's a Match!",
             description: `You and ${profileToLike.first_name} liked each other!`,
           });
         }
        
      } catch (error) {
        console.error('❌ Background like processing error:', error);
        // Error is handled in background - UI already moved forward
      } finally {
        setActionLoading(false);
      }
    });
    
    // UI is already responsive - set loading to false quickly
    setTimeout(() => setActionLoading(false), 100);
  };

  const handlePass = async () => {
    if (!user || !currentProfile || actionLoading) return;
    
    console.log('⏭️ Starting pass process for profile:', currentProfile.user_id);
    setActionLoading(true);
    
    // OPTIMISTIC UI UPDATE - Move to next profile immediately for speed
    const profileToPass = currentProfile; // Store reference before moving
    handleNext(); // Move UI immediately
    
    // Non-blocking haptic feedback and analytics
    enhancedButtonPress(); // Remove await for speed
    analytics.profilePassed(user.id, profileToPass.user_id);
    
    // Background processing - don't block UI
    if (!showingSkipped) {
      Promise.resolve().then(async () => {
        try {
          // Record the pass in the database (background)
          const { error } = await supabase
            .from('passes')
            .insert({
              passer_id: user.id,
              passed_id: profileToPass.user_id
            });

          if (error) {
            console.error('❌ Error recording pass:', error);
          } else {
            console.log('✅ Pass recorded successfully');
          }
        } catch (error) {
          console.error('❌ Background pass processing error:', error);
          // Error is handled in background - UI already moved forward
        }
      });
    }
    
    // UI is already responsive - set loading to false quickly
    setTimeout(() => setActionLoading(false), 50);
    
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
  
  // Debug logging
  console.log('🔍 Debug info:', {
    profilesLength: profiles.length,
    currentIndex,
    hasCurrentProfile: !!currentProfile,
    loading,
    showingSkipped
  });

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
    <div className="mobile-safe-x mobile-safe-bottom pb-1 px-3 sm:p-6">
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

      {/* Centered Profile Card Container */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm px-2 pb-2">
          <MobileProfileCard
            profile={currentProfile}
            onImageClick={openImageViewer}
            isUserOnline={isUserOnline}
            getLastSeenText={getLastSeenText}
            onLike={handleLike}
            onPass={handlePass}
            className="animate-scale-in"
          />
        </div>
      </div>

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

export default memo(DiscoverProfiles);