import { Users, RefreshCw, AlertCircle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { OptimizedButton } from "@/components/OptimizedComponents";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedLikesData } from "@/hooks/useEnhancedLikesData";
import { useState } from "react";
import ExtendedProfileOverlay from "@/components/ExtendedProfileOverlay";
interface EnhancedMatchesPageProps {
  selectedProfileForView: any;
  setSelectedProfileForView: (profile: any) => void;
  setShowProfileView: (show: boolean) => void;
}
const EnhancedMatchesPage = ({
  selectedProfileForView,
  setSelectedProfileForView,
  setShowProfileView
}: EnhancedMatchesPageProps) => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [isLikingBack, setIsLikingBack] = useState<string | null>(null);
  const {
    likes,
    loading,
    error,
    refreshing,
    refresh,
    retry,
    hasError,
    canRetry
  } = useEnhancedLikesData();
  const handleLikeBack = async (likedProfile: any) => {
    try {
      setIsLikingBack(likedProfile.user_id);

      // Check if user already liked this person back
      const {
        data: existingLike
      } = await supabase.from('likes').select('id').eq('liker_id', user?.id).eq('liked_id', likedProfile.user_id).maybeSingle();
      if (existingLike) {
        toast({
          title: "Already liked!",
          description: "You've already liked this person back."
        });
        return;
      }

      // Check daily likes limit
      const {
        data: canLike,
        error: limitError
      } = await supabase.rpc('check_and_increment_daily_likes', {
        target_user_id: likedProfile.user_id
      });
      if (limitError) {
        throw new Error('Failed to check like limit');
      }
      if (!canLike) {
        toast({
          title: "Daily Limit Reached",
          description: "You've reached your daily like limit. Try again tomorrow!",
          variant: "destructive"
        });
        return;
      }

      // Create the like
      const {
        error
      } = await supabase.from('likes').insert({
        liker_id: user?.id,
        liked_id: likedProfile.user_id
      });
      if (error) {
        throw error;
      }
      // Fire push to liked user (non-blocking)
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: likedProfile.user_id,
            type: 'like',
            title: 'Someone liked your profile',
            body: `${user.user_metadata?.first_name || 'Someone'} liked you`,
            data: { source: 'likes' }
          }
        });
      } catch (e) {
        console.warn('Push invoke failed (like):', e);
      }
      toast({
        title: "Success!",
        description: "You connected with them!"
      });
    } catch (error: any) {
      console.error('Error liking back:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to like back. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLikingBack(null);
    }
  };
  const renderErrorState = () => <div className="text-center py-12">
      <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {error?.code === 'NETWORK_ERROR' ? 'Connection Error' : 'Something went wrong'}
      </h3>
      <p className="text-gray-500 text-sm mb-4">
        {error?.message || 'Failed to load your likes'}
      </p>
      {canRetry && <Button onClick={retry} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>}
    </div>;
  const renderOfflineState = () => <div className="text-center py-12">
      <WifiOff className="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">You're offline</h3>
      <p className="text-gray-500 text-sm">
        Check your connection and try again
      </p>
    </div>;
  const renderLoadingState = () => <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  const renderEmptyState = () => <div className="text-center py-12">
      <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">No likes yet</h3>
      <p className="text-gray-500 text-sm mb-4">
        Keep discovering profiles - your matches will appear here!
      </p>
      <Button onClick={refresh} variant="outline" size="sm" className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Refresh
      </Button>
    </div>;
  const renderLikesContent = () => {
    if (loading) return renderLoadingState();
    if (hasError) return renderErrorState();
    if (!navigator.onLine) return renderOfflineState();
    if (likes.length === 0) return renderEmptyState();
    return <div className="divide-y divide-gray-200">
        {likes.map(likedProfile => <Card key={likedProfile.user_id} className="overflow-hidden hover:shadow-lg transition-shadow border-0 border-b border-gray-100 rounded-none last:border-b-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gradient-primary flex-shrink-0">
                  {likedProfile.avatar_url ? <img src={likedProfile.avatar_url} alt={`${likedProfile.first_name}'s avatar`} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                    {likedProfile.first_name} {likedProfile.last_name}
                  </h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {likedProfile.ms_subtype && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                        {likedProfile.ms_subtype}
                      </span>}
                    {likedProfile.location && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                        📍 {likedProfile.location}
                      </span>}
                  </div>
                </div>
                
                <div className="flex-shrink-0 flex flex-col gap-2 min-w-0 sm:min-w-[120px]">
                  <Button size="sm" variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm" onClick={() => {
                    setLocalProfile({
                      id: (likedProfile as any).id || likedProfile.user_id,
                      user_id: likedProfile.user_id,
                      first_name: likedProfile.first_name,
                      age: (likedProfile as any).age || null,
                      city: likedProfile.location ? likedProfile.location.split(',')[0] : '',
                      gender: (likedProfile as any).gender || null,
                      ms_subtype: likedProfile.ms_subtype || null,
                      avatar_url: likedProfile.avatar_url || null,
                      about_me_preview: (likedProfile as any).about_me_preview || null,
                      hobbies: (likedProfile as any).hobbies || [],
                      additional_photos: (likedProfile as any).additional_photos || [],
                      selected_prompts: (likedProfile as any).selected_prompts || [],
                      extended_profile_completed: (likedProfile as any).extended_profile_completed || false,
                      symptoms: (likedProfile as any).symptoms || [],
                      medications: (likedProfile as any).medications || [],
                      last_seen: (likedProfile as any).last_seen || undefined,
                    } as any);
                    setLocalShowExtended(true);
                  }}>
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    View
                  </Button>
                  <OptimizedButton size="sm" className="w-full bg-gradient-primary hover:opacity-90 text-white text-xs sm:text-sm" onClick={() => handleLikeBack(likedProfile)} disabled={isLikingBack === likedProfile.user_id} debounceMs={2000}>
                    {isLikingBack === likedProfile.user_id ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" /> : <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                    Connect With
                  </OptimizedButton>
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>;
  };
  const [localShowExtended, setLocalShowExtended] = useState(false);
  const [localProfile, setLocalProfile] = useState<any | null>(null);
  return <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Who Connected With You</h2>
            {refreshing && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
          </div>
          
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderLikesContent()}
      </div>
      <ExtendedProfileOverlay
        profile={localProfile as any}
        isOpen={!!localShowExtended}
        onClose={() => setLocalShowExtended(false)}
        onLike={localProfile ? () => handleLikeBack(localProfile) : undefined}
        onPass={() => setLocalShowExtended(false)}
      />
    </div>;
};
export default EnhancedMatchesPage;