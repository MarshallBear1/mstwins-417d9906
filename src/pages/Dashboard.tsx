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
import { useOptimizedDashboardData } from "@/hooks/useOptimizedDashboardData";
import { useDailyLikes } from "@/hooks/useDailyLikes";
import { useRobotAnnouncements } from "@/hooks/useRobotAnnouncements";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import SEO from "@/components/SEO";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";
import MobileKeyboardHandler from "@/components/MobileKeyboardHandler";
import { OptimizedAvatar } from "@/components/PerformanceOptimizer";
import MatchesPage from "@/components/MatchesPage";
import ForumPage from "@/components/ForumPage";
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
  

  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'discover';

  // Use optimized data fetching hook
  const { 
    profile, 
    likes, 
    profileLoading, 
    likesLoading, 
    fetchProfile, 
    fetchLikes 
  } = useOptimizedDashboardData({ user, activeTab });

  const [isReturningUser, setIsReturningUser] = useState(false);
  const [selectedProfileForView, setSelectedProfileForView] = useState<Profile | null>(null);
  const [showProfileView, setShowProfileView] = useState(false);

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
      // Profile fetching is now handled by the optimized hook
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
  }, [user, fetchProfile]);
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

  // Set up real-time subscription to refresh likes when there are new notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`likes-updates-${user.id}`).on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'likes',
      filter: `liked_id=eq.${user.id}`
    }, () => {
      // Always refresh likes when someone likes the current user
      fetchLikes();
    }).on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'matches'
    }, () => {
      // Always refresh likes when a new match is created (to remove them from likes)
      fetchLikes();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchLikes]);
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
                // Force re-render by reloading
                window.location.reload();
              }} className="flex-shrink-0 p-1 h-auto">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>}
            <DiscoverProfiles />
          </div>;
      case "likes":
        return <MatchesPage 
          likes={likes}
          likesLoading={likesLoading}
          fetchLikes={fetchLikes}
          selectedProfileForView={selectedProfileForView}
          setSelectedProfileForView={setSelectedProfileForView}
          setShowProfileView={setShowProfileView}
        />;
      case "messages":
        return <Messaging />;
      case "forum":
        return <ForumPage />;
      case "profile":
        return profile ? <ProfileCard profile={profile as any} onProfileUpdate={fetchProfile} onSignOut={handleSignOut} /> : null;
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard?tab=profile')}
              className={`p-2 transition-colors ${
                activeTab === 'profile' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <User className="w-5 h-5" />
            </Button>
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