import { useEffect, useState, memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, MessageCircle, User, Edit, MapPin, Calendar, X, Eye, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import NotificationPopup from "@/components/NotificationPopup";
import DiscoverProfiles from "@/components/DiscoverProfiles";
import Messaging from "@/components/Messaging";
import ProfileCard from "@/components/ProfileCard";
import ReferralDropdown from "@/components/ReferralDropdown";
import FeedbackDialog from "@/components/FeedbackDialog";
import DiscoverProfileCard from "@/components/DiscoverProfileCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import RobotAnnouncementPopup from "@/components/RobotAnnouncementPopup";
import { useDailyLikes } from "@/hooks/useDailyLikes";
import { useRobotAnnouncements } from "@/hooks/useRobotAnnouncements";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import SEO from "@/components/SEO";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";
import MobileKeyboardHandler from "@/components/MobileKeyboardHandler";
import { OptimizedAvatar } from "@/components/PerformanceOptimizer";
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
const Dashboard = () => {
  const {
    user,
    loading: authLoading,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const { isMobile, safeAreaInsets } = useMobileOptimizations();
  const { announcements, currentAnnouncement, showAnnouncement, dismissAnnouncement } = useRobotAnnouncements();
  const { remainingLikes, hasUnlimitedLikes, isLimitEnforced } = useDailyLikes();
  const { requestAllPermissions } = useRealtimeNotifications();
  

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [likes, setLikes] = useState<Profile[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [selectedProfileForView, setSelectedProfileForView] = useState<Profile | null>(null);
  const [showProfileView, setShowProfileView] = useState(false);
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'discover';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);
  useEffect(() => {
    if (user) {
      // Check if user is returning (has logged in before)
      const lastLogin = localStorage.getItem(`lastLogin_${user.id}`);
      setIsReturningUser(!!lastLogin);
      localStorage.setItem(`lastLogin_${user.id}`, new Date().toISOString());
      fetchProfile();
    }
  }, [user]);

  // Re-fetch profile when user returns to tab (e.g., after completing extended profile)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchProfile();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);
  const fetchProfile = async () => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Starting profile fetch for user:', user.id);
    }
    setProfileLoading(true);
    
    try {
      // Only select necessary fields for better performance
      const selectFields = 'id, user_id, first_name, last_name, date_of_birth, location, gender, ms_subtype, diagnosis_year, symptoms, medications, hobbies, avatar_url, about_me, last_seen, additional_photos, selected_prompts, extended_profile_completed';
      
      const {
        data,
        error
      } = await supabase.from('profiles').select(selectFields).eq('user_id', user.id).maybeSingle();
      
      if (error) {
        console.error('❌ Error fetching profile:', error);
        setProfile(null);
        return;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Profile fetched successfully:', data ? 'Profile exists' : 'No profile found');
      }
      
      setProfile(data ? {
        ...data,
        selected_prompts: Array.isArray(data.selected_prompts) ? data.selected_prompts as {
          question: string;
          answer: string;
        }[] : []
      } : null);

      // Update last_seen timestamp in background to not block UI
      if (data) {
        try {
          await supabase.rpc('update_user_last_seen', {
            user_id_param: user.id
          });
        } catch (error) {
          console.error('Error updating last seen:', error);
          // Don't block UI for this background operation
        }
      }
    } catch (error) {
      console.error('❌ Exception in fetchProfile:', error);
      setProfile(null);
    } finally {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Profile loading completed');
      }
      setProfileLoading(false);
    }
  };

  // Auto-prompt for browser notifications
  useEffect(() => {
    if (!user || !profile) return;

    // Only prompt once per session to avoid spam
    const hasPromptedThisSession = sessionStorage.getItem(`notif_prompted_${user.id}`);
    if (hasPromptedThisSession) return;

    // Prompt after a brief delay when user first accesses dashboard with profile
    const timer = setTimeout(async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          await requestAllPermissions();
          sessionStorage.setItem(`notif_prompted_${user.id}`, 'true');
        } catch (error) {
          console.log('Notification permission request failed:', error);
        }
      }
    }, 3000); // 3 second delay for natural UX

    return () => clearTimeout(timer);
  }, [user, profile, requestAllPermissions]);
  const fetchLikes = async () => {
    if (!user) return;
    setLikesLoading(true);
    try {
      // Get people who liked the current user
      const {
        data: likeData,
        error
      } = await supabase.from('likes').select('liker_id, created_at').eq('liked_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching likes:', error);
        return;
      }
      if (!likeData || likeData.length === 0) {
        setLikes([]);
        return;
      }

      // Get existing matches to exclude them from likes
      const {
        data: existingMatches
      } = await supabase.from('matches').select('user1_id, user2_id').or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      const matchedIds = existingMatches?.map(match => match.user1_id === user.id ? match.user2_id : match.user1_id) || [];

      // Filter out users who are already matched
      const unmatchedLikers = likeData.filter(like => !matchedIds.includes(like.liker_id));
      if (unmatchedLikers.length === 0) {
        setLikes([]);
        return;
      }

      // Get the profiles of people who liked the user (excluding matches)
      const likerIds = unmatchedLikers.map(like => like.liker_id);
      const selectFields = 'id, user_id, first_name, last_name, date_of_birth, location, gender, ms_subtype, diagnosis_year, symptoms, medications, hobbies, avatar_url, about_me, last_seen, additional_photos, selected_prompts';
      const {
        data: profiles,
        error: profilesError
      } = await supabase.from('profiles').select(selectFields).in('user_id', likerIds);
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }
      setLikes((profiles || []).map(profile => ({
        ...profile,
        selected_prompts: Array.isArray(profile.selected_prompts) ? profile.selected_prompts as {
          question: string;
          answer: string;
        }[] : []
      })));
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setLikesLoading(false);
    }
  };

  // Fetch likes when the likes tab is opened
  useEffect(() => {
    if (activeTab === 'likes' && user) {
      fetchLikes();
    }
  }, [activeTab, user]);

  // Set up real-time subscription to refresh likes when there are new notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`likes-updates-${user.id}`).on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'likes',
      filter: `liked_id=eq.${user.id}`
    }, () => {
      // Refresh likes when someone likes the current user
      if (activeTab === 'likes') {
        fetchLikes();
      }
    }).on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'matches'
    }, () => {
      // Refresh likes when a new match is created (to remove them from likes)
      if (activeTab === 'likes') {
        fetchLikes();
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeTab]);
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  if (authLoading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  if (!user) return null;

  // Profile enforcement - redirect to profile setup if no profile exists
  if (!profile) {
    return <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-xl animate-pulse">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-4 animate-fade-in">
              Complete Your Profile! ✨
            </h2>
            <p className="text-muted-foreground mb-6">
              You're so close! Complete your profile to start discovering amazing connections in the MS community.
            </p>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6 border border-primary/10">
              <p className="text-sm text-primary font-medium">
                🚀 Profile completion unlocks:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 text-left">
                <li>• Discover supportive community members</li>
                <li>• Get likes and matches</li>
                <li>• Start meaningful conversations</li>
              </ul>
            </div>
            <Button onClick={() => navigate("/profile-setup")} className="w-full bg-gradient-primary hover:opacity-90 text-white font-medium py-3 animate-scale-in" size="lg">
              Complete Profile Now
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  const renderContent = () => {
    switch (activeTab) {
      case "discover":
        return <div className="pt-6">
            {/* Extended Profile Prompt */}
            {profile && !profile.extended_profile_completed && <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mx-4 mb-4">
                <div className="flex items-start space-x-3">
                  <img src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" alt="Helpful robot" className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <div className="bg-white rounded-lg p-3 shadow-sm relative">
                      <div className="absolute -left-2 top-3 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-white border-b-4 border-b-transparent"></div>
                      <p className="text-sm text-foreground font-medium mb-1">
                        💡 Stand out even more!
                      </p>
                      <p className="text-sm text-foreground mb-3">
                        Add more photos and personal stories to get noticed by potential matches.
                      </p>
                      <Button size="sm" onClick={() => navigate("/extended-profile")} className="bg-gradient-primary hover:opacity-90 text-white">
                        Add More Details
                      </Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                // Mark as dismissed for this session
                sessionStorage.setItem(`extended_prompt_dismissed_${user?.id}`, 'true');
                // Force re-render by updating state
                setProfile(prev => prev ? {
                  ...prev,
                  extended_profile_completed: true
                } : null);
              }} className="flex-shrink-0 p-1 h-auto">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>}
            <DiscoverProfiles />
          </div>;
      case "matches":
        return <MatchesPage 
          likes={likes}
          likesLoading={likesLoading}
          fetchLikes={fetchLikes}
          selectedProfileForView={selectedProfileForView}
          setSelectedProfileForView={setSelectedProfileForView}
          setShowProfileView={setShowProfileView}
        />;
      case "forum":
        return <ForumPage />;
      case "profile":
        return <ProfileCard profile={profile} onProfileUpdate={updatedProfile => setProfile({
          ...updatedProfile,
          last_seen: profile.last_seen
        })} onSignOut={handleSignOut} />;
      default:
        return null;
    }
  };
  return <MobileKeyboardHandler>
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEO 
        title="MStwins Dashboard - Your MS Support Community"
        description="Access your Multiple Sclerosis support network. Discover new connections, manage matches, and engage with your community."
        canonical="https://mstwins.com/dashboard"
      />

      {/* Notification Popup */}
      <NotificationPopup />

      {/* Robot Announcement Popup */}
      {showAnnouncement && currentAnnouncement && <RobotAnnouncementPopup announcement={currentAnnouncement} onDismiss={() => dismissAnnouncement(currentAnnouncement.id)} />}
      
      {/* Modern header with clean design */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40 shadow-[0_1px_10px_rgba(0,0,0,0.05)]" style={{
        paddingTop: isMobile ? `max(0.75rem, ${safeAreaInsets.top}px)` : undefined
      }}>
        <div className="flex items-center justify-between mobile-safe-x py-3">
          {/* Left side - Modern Logo (borderless and bigger) */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11">
              <img 
                src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                alt="MSTwins" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-gray-900">MS</span><span className="text-blue-600">Twins</span>
            </span>
          </div>
          
          {/* Right side - Clean action buttons with better mobile spacing */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <ReferralDropdown />
            <FeedbackDialog />
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* Main content with padding for persistent bottom nav */}
      <div className="flex-1 mobile-scroll bg-gray-50" style={{
        paddingBottom: isMobile ? `max(8rem, ${safeAreaInsets.bottom + 100}px)` : '6rem'
      }}>
        <div className="transition-all duration-300 ease-in-out">
          {renderContent()}
        </div>
      </div>

      {/* Profile View Dialog */}
      <Dialog open={showProfileView} onOpenChange={(open) => {
        setShowProfileView(open);
        if (!open) {
          setSelectedProfileForView(null);
        }
      }}>
        <DialogContent className="p-0 max-w-[90vw] w-full max-h-[90vh] overflow-hidden sm:max-w-md border-0 bg-transparent shadow-none">
          {selectedProfileForView && (
            <div className="h-full w-full flex items-center justify-center">
              <div className="w-full max-w-sm">
                <DiscoverProfileCard profile={selectedProfileForView} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </MobileKeyboardHandler>;
};
export default memo(Dashboard);