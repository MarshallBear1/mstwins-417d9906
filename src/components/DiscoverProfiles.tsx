import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [actionCooldown, setActionCooldown] = useState(false);
  const { remainingLikes, refreshRemainingLikes } = useDailyLikes();
  const { vibrate } = useHaptics();
  const { isUserOnline } = useRealtimePresence();
  const [debugInfo, setDebugInfo] = useState<string>('');

  // 🔍 Debug logging
  console.log('🔍 DiscoverProfiles component rendered:', {
    user: user?.id,
    loading,
    profilesCount: profiles.length,
    currentIndex
  });

  // 🔍 Test database connection on mount
  useEffect(() => {
    const testConnection = async () => {
      console.log('🔍 Testing database connection...');
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        console.log('📊 Database test result:', { data, error });
        
        if (user) {
          console.log('🔐 Auth user check:', {
            userId: user.id,
            email: user.email,
            authenticated: !!user
          });
          
          // Test if we can query profiles
          const { data: profileTest, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, moderation_status')
            .limit(5);
          
          console.log('👤 Profile query test:', {
            profiles: profileTest?.length || 0,
            error: profileError,
            sample: profileTest?.slice(0, 2)
          });
        }
      } catch (error) {
        console.error('❌ Database connection test failed:', error);
        setDebugInfo(`DB Error: ${error}`);
      }
    };

    testConnection();
  }, [user]);

  // Optimized profile fetching with parallel queries
  const fetchProfiles = useCallback(async () => {
    if (!user) {
      console.log('❌ No user found, skipping profile fetch');
      return;
    }

    console.log('🔄 Fetching discover profiles for user:', user.id);
    setLoading(true);
    setDebugInfo('Loading profiles...');
    
    try {
      console.log('📡 Starting parallel queries...');
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
            moderation_status
          `)
          .neq('user_id', user.id)
          .eq('moderation_status', 'approved')
          .order('last_seen', { ascending: false })
          .limit(20),
        
        supabase
          .from('likes')
          .select('liked_id')
          .eq('liker_id', user.id),
        
        supabase
          .from('passes')
          .select('passed_id')
          .eq('passer_id', user.id)
      ]);

      console.log('📊 Query results:', {
        profiles: {
          count: profilesResult.data?.length || 0,
          error: profilesResult.error,
          sample: profilesResult.data?.slice(0, 2)?.map(p => ({ 
            id: p.id, 
            name: p.first_name, 
            moderation_status: p.moderation_status 
          }))
        },
        likes: {
          count: likedResult.data?.length || 0,
          error: likedResult.error
        },
        passes: {
          count: passedResult.data?.length || 0,
          error: passedResult.error
        }
      });

      if (profilesResult.error) {
        console.error('❌ Profiles query error:', profilesResult.error);
        setDebugInfo(`Profile query error: ${profilesResult.error.message}`);
        throw profilesResult.error;
      }

      if (likedResult.error) {
        console.error('❌ Likes query error:', likedResult.error);
        setDebugInfo(`Likes query error: ${likedResult.error.message}`);
      }

      if (passedResult.error) {
        console.error('❌ Passes query error:', passedResult.error);
        setDebugInfo(`Passes query error: ${passedResult.error.message}`);
      }

      const likedIds = new Set(likedResult.data?.map(like => like.liked_id) || []);
      const passedIds = new Set(passedResult.data?.map(pass => pass.passed_id) || []);

      console.log('🔍 Filtering profiles:', {
        totalProfiles: profilesResult.data?.length || 0,
        likedIds: likedIds.size,
        passedIds: passedIds.size
      });

      // Filter out already liked/passed profiles
      const filteredProfiles = profilesResult.data?.filter(
        profile => !likedIds.has(profile.user_id) && !passedIds.has(profile.user_id)
      ) || [];

      console.log('✅ Final filtered profiles:', {
        count: filteredProfiles.length,
        profiles: filteredProfiles.slice(0, 3).map(p => ({ 
          id: p.id, 
          name: p.first_name,
          location: p.location 
        }))
      });

      setProfiles(filteredProfiles as Profile[]);
      setCurrentIndex(0);
      setDebugInfo(`Loaded ${filteredProfiles.length} profiles`);
      
    } catch (error: any) {
      console.error('❌ Error fetching profiles:', error);
      setDebugInfo(`Error: ${error.message}`);
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

  // Memoized current profile calculation
  const currentProfile = useMemo(() => {
    return profiles[currentIndex] || null;
  }, [profiles, currentIndex]);

  // Optimized like function with cooldown
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
    setTimeout(() => setActionCooldown(false), 1000);

    try {
      const { error } = await supabase
        .from('likes')
        .insert({
          liker_id: user.id,
          liked_id: profileUserId
        });

      if (error) throw error;

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
      toast({
        title: "Error liking profile",
        description: error.message === 'Users cannot like their own profile' 
          ? "You can't like your own profile!" 
          : "Please try again later.",
        variant: "destructive"
      });
    }
  }, [user, actionCooldown, remainingLikes, vibrate, refreshRemainingLikes, toast]);

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

      toast({
        title: "Profile passed",
        description: "Moved to the next profile."
      });
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

  // Show loading state with debug info
  if (loading && profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-gray-600">Finding amazing people for you...</p>
        {debugInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="text-blue-700 font-medium">Debug Info:</p>
            <p className="text-blue-600">User: {user?.id || 'Not authenticated'}</p>
            <p className="text-blue-600">Status: {debugInfo}</p>
          </div>
        )}
      </div>
    );
  }

  // Show empty state with debug info
  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No more profiles to discover
          </h3>
          <p className="text-gray-600 mb-4">
            Check back later for new profiles or adjust your preferences.
          </p>
          <Button onClick={fetchProfiles} className="bg-gradient-primary text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          {/* Debug information */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-left">
              <p className="text-gray-700 font-medium mb-2">Debug Info:</p>
              <p className="text-gray-600">User: {user?.id ? 'Authenticated' : 'Not authenticated'}</p>
              <p className="text-gray-600">Profiles loaded: {profiles.length}</p>
              <p className="text-gray-600">Current index: {currentIndex}</p>
              <p className="text-gray-600">Status: {debugInfo || 'No status'}</p>
              <p className="text-gray-600">Remaining likes: {remainingLikes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Remaining likes warning */}
      <LikeLimitWarning 
        open={remainingLikes <= 2 && remainingLikes > 0} 
        onOpenChange={() => {}} 
        remainingLikes={remainingLikes} 
      />
      
      {/* Profile Card */}
      {currentProfile && (
        <Card className="mx-auto max-w-md overflow-hidden shadow-lg">
          <CardContent className="p-0">
            {/* Profile Image */}
            <div 
              className="relative h-96 bg-gradient-to-br from-blue-400/20 via-purple-300/20 to-pink-300/20 cursor-pointer"
              onClick={handleImageClick}
            >
              {currentProfile.avatar_url ? (
                <img
                  src={currentProfile.avatar_url}
                  alt={`${currentProfile.first_name}'s profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-24 h-24 text-gray-400" />
                </div>
              )}
              
              {/* Online status */}
              {isUserOnline(currentProfile.user_id) && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                  Online
                </div>
              )}
            </div>
            
            {/* Profile Info */}
            <div className="p-4 space-y-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentProfile.first_name} {currentProfile.last_name}
                </h2>
                {currentProfile.date_of_birth && (
                  <p className="text-gray-600">Age {calculateAge(currentProfile.date_of_birth)}</p>
                )}
              </div>
              
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{currentProfile.location}</span>
              </div>
              
              {currentProfile.ms_subtype && (
                <div className="bg-blue-50 px-3 py-2 rounded-lg">
                  <span className="text-blue-700 font-medium">{currentProfile.ms_subtype}</span>
                </div>
              )}
              
              {currentProfile.about_me && (
                <p className="text-gray-700 text-sm">{currentProfile.about_me}</p>
              )}
              
              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
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
                  Like ({remainingLikes})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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