import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, MessageCircle, User, Edit, MapPin, Calendar, X, LogOut, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import NotificationPopup from "@/components/NotificationPopup";
import DiscoverProfiles from "@/components/DiscoverProfiles";
import Messaging from "@/components/Messaging";
import ProfileCard from "@/components/ProfileCard";
import ReferralDropdown from "@/components/ReferralDropdown";
import FeedbackDialog from "@/components/FeedbackDialog";
import ProfileViewDialog from "@/components/ProfileViewDialog";
import RobotAnnouncementPopup from "@/components/RobotAnnouncementPopup";

import { useDailyLikes } from "@/hooks/useDailyLikes";
import { useRobotAnnouncements } from "@/hooks/useRobotAnnouncements";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

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
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { remainingLikes, isLimitEnforced, hasUnlimitedLikes } = useDailyLikes();
  const { currentAnnouncement, showAnnouncement, dismissAnnouncement } = useRobotAnnouncements();
  const { requestNotificationPermission } = useRealtimeNotifications();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("discover");
  const [likes, setLikes] = useState<Profile[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [selectedProfileForView, setSelectedProfileForView] = useState<Profile | null>(null);
  const [showProfileView, setShowProfileView] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      // Check if user is returning (has logged in before)
      const lastLogin = localStorage.getItem(`lastLogin_${user.id}`);
      setIsReturningUser(!!lastLogin);
      localStorage.setItem(`lastLogin_${user.id}`, new Date().toISOString());
      
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data ? {
        ...data,
        selected_prompts: Array.isArray(data.selected_prompts) ? data.selected_prompts as { question: string; answer: string; }[] : []
      } : null);
      
      // Update last_seen timestamp in background to not block UI
      if (data) {
        try {
          await supabase.rpc('update_user_last_seen', { user_id_param: user.id });
        } catch (error) {
          console.error('Error updating last seen:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
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
          await requestNotificationPermission();
          sessionStorage.setItem(`notif_prompted_${user.id}`, 'true');
        } catch (error) {
          console.log('Notification permission request failed:', error);
        }
      }
    }, 3000); // 3 second delay for natural UX

    return () => clearTimeout(timer);
  }, [user, profile, requestNotificationPermission]);

  const fetchLikes = async () => {
    if (!user) return;
    
    setLikesLoading(true);
    try {
      // Get people who liked the current user
      const { data: likeData, error } = await supabase
        .from('likes')
        .select('liker_id, created_at')
        .eq('liked_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching likes:', error);
        return;
      }

      if (!likeData || likeData.length === 0) {
        setLikes([]);
        return;
      }

      // Get existing matches to exclude them from likes
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      const matchedIds = existingMatches?.map(match => 
        match.user1_id === user.id ? match.user2_id : match.user1_id
      ) || [];

      // Filter out users who are already matched
      const unmatchedLikers = likeData.filter(like => 
        !matchedIds.includes(like.liker_id)
      );

      if (unmatchedLikers.length === 0) {
        setLikes([]);
        return;
      }

      // Get the profiles of people who liked the user (excluding matches)
      const likerIds = unmatchedLikers.map(like => like.liker_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', likerIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      setLikes((profiles || []).map(profile => ({
        ...profile,
        selected_prompts: Array.isArray(profile.selected_prompts) ? profile.selected_prompts as { question: string; answer: string; }[] : []
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

    const channel = supabase
      .channel(`likes-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes',
          filter: `liked_id=eq.${user.id}`
        },
        () => {
          // Refresh likes when someone likes the current user
          if (activeTab === 'likes') {
            fetchLikes();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches'
        },
        () => {
          // Refresh likes when a new match is created (to remove them from likes)
          if (activeTab === 'likes') {
            fetchLikes();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeTab]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  // Profile enforcement - redirect to profile setup if no profile exists
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
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
            <Button 
              onClick={() => navigate("/profile-setup")}
              className="w-full bg-gradient-primary hover:opacity-90 text-white font-medium py-3 animate-scale-in"
              size="lg"
            >
              Complete Profile Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: "discover", label: "Discover", icon: Heart },
    { id: "likes", label: "Likes", icon: Users },
    { id: "matches", label: "Matches", icon: MessageCircle },
    { id: "profile", label: "Profile", icon: User },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "discover":
        return (
          <div>
            {/* Extended Profile Prompt */}
            {profile && !profile.extended_profile_completed && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 m-4">
                <div className="flex items-start space-x-3">
                  <img 
                    src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                    alt="Helpful robot"
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="bg-white rounded-lg p-3 shadow-sm relative">
                      <div className="absolute -left-2 top-3 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-white border-b-4 border-b-transparent"></div>
                      <p className="text-sm text-foreground font-medium mb-1">
                        💡 Stand out even more!
                      </p>
                      <p className="text-sm text-foreground mb-3">
                        Add more photos and personal stories to get noticed by potential matches.
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => navigate("/extended-profile")}
                        className="bg-gradient-primary hover:opacity-90 text-white"
                      >
                        Add More Details
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Mark as dismissed for this session
                      sessionStorage.setItem(`extended_prompt_dismissed_${user?.id}`, 'true');
                      // Force re-render by updating state
                      setProfile(prev => prev ? { ...prev, extended_profile_completed: true } : null);
                    }}
                    className="flex-shrink-0 p-1 h-auto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <DiscoverProfiles />
          </div>
        );
      case "likes":
        return (
          <div className="p-3 sm:p-6">
            <div className="text-center mb-6">
              <Users className="w-12 sm:w-16 h-12 sm:h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-2">People Who Liked You</h2>
              <p className="text-sm sm:text-base text-muted-foreground">See who's interested in connecting</p>
            </div>
            
            {likesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : likes.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {likes.map((likedProfile) => (
                  <Card key={likedProfile.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gradient-primary flex-shrink-0">
                           {likedProfile.avatar_url ? (
                             <img 
                               src={likedProfile.avatar_url} 
                               alt={`${likedProfile.first_name}'s avatar`}
                               className="w-full h-full object-cover"
                               loading="lazy"
                               onLoad={(e) => {
                                 e.currentTarget.style.opacity = '1';
                               }}
                               onError={(e) => {
                                 e.currentTarget.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${likedProfile.first_name}&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile`;
                               }}
                               style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                             />
                           ) : (
                            <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                              <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg truncate">
                            {likedProfile.first_name} {likedProfile.last_name}
                          </h3>
                          
                          <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="truncate">{likedProfile.location}</span>
                          </div>
                          
                          {likedProfile.date_of_birth && (
                            <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span>
                                {(() => {
                                  const birth = new Date(likedProfile.date_of_birth);
                                  const today = new Date();
                                  let age = today.getFullYear() - birth.getFullYear();
                                  const monthDiff = today.getMonth() - birth.getMonth();
                                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                                    age--;
                                  }
                                  return age;
                                })()} years old
                              </span>
                            </div>
                          )}
                          
                          {likedProfile.ms_subtype && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {likedProfile.ms_subtype}
                            </Badge>
                          )}
                         </div>
                         
                          <div className="flex-shrink-0 space-y-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
                              onClick={() => {
                                setSelectedProfileForView(likedProfile);
                                setShowProfileView(true);
                              }}
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              className="w-full bg-gradient-primary hover:opacity-90 text-white text-xs sm:text-sm"
                              onClick={async () => {
                                try {
                                  console.log('🚀 Starting like back process for:', likedProfile.user_id);
                                  
                                  // Check if user already liked this person back
                                  const { data: existingLike } = await supabase
                                    .from('likes')
                                    .select('id')
                                    .eq('liker_id', user?.id)
                                    .eq('liked_id', likedProfile.user_id)
                                    .maybeSingle();

                                  if (existingLike) {
                                    console.log('✅ Already liked back');
                                    fetchLikes(); // Refresh to show updated state
                                    return;
                                  }

                                  // Create a like back
                                  const { error } = await supabase
                                    .from('likes')
                                    .insert({
                                      liker_id: user?.id,
                                      liked_id: likedProfile.user_id
                                    });

                                  if (error) {
                                    console.error('❌ Error liking back:', error);
                                    return;
                                  }

                                  console.log('✅ Liked back successfully!');
                                  
                                  // Refresh the likes to show updated state
                                  fetchLikes();
                                } catch (error) {
                                  console.error('❌ Error in like back process:', error);
                                }
                              }}
                            >
                             <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                             Like Back
                           </Button>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="mt-6">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No likes yet. Start discovering!</p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case "matches":
        return <Messaging />;
      case "profile":
        return (
          <ProfileCard 
            profile={profile}
            onProfileUpdate={(updatedProfile) => setProfile({ ...updatedProfile, last_seen: profile.last_seen })}
            onSignOut={handleSignOut}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <NotificationPopup />
      
      {/* Robot Announcement Popup */}
      {showAnnouncement && currentAnnouncement && (
        <RobotAnnouncementPopup
          announcement={currentAnnouncement}
          onDismiss={() => dismissAnnouncement(currentAnnouncement.id)}
        />
      )}
      
      {/* Header with notifications and referral */}
      <div className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-white border border-gray-200 p-1 shadow-sm">
              <img src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" alt="MSTwins mascot" className="w-full h-full object-contain" />
            </div>
            <span className="text-base sm:text-lg font-bold text-foreground">
              MSTwins
            </span>
            {/* Daily Likes Counter */}
            {isLimitEnforced() && !hasUnlimitedLikes && (
              <div className="hidden sm:flex items-center space-x-1 bg-primary/10 px-2 py-1 rounded-full">
                <Heart className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">{remainingLikes}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile Daily Likes Counter */}
            {isLimitEnforced() && !hasUnlimitedLikes && (
              <div className="sm:hidden flex items-center space-x-1 bg-primary/10 px-2 py-1 rounded-full">
                <Heart className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">{remainingLikes}</span>
              </div>
            )}
            <NotificationBell />
            <ReferralDropdown />
            <FeedbackDialog />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content with smooth transitions */}
      <div className="flex-1 pb-20">
        <div className="transition-all duration-300 ease-in-out">
          {renderContent()}
        </div>
      </div>

      {/* Enhanced bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around py-2 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-all duration-200 hover-scale ${
                  isActive 
                    ? "text-primary bg-primary/10 scale-105" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
                {isActive && <div className="w-1 h-1 bg-primary rounded-full animate-scale-in" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile View Dialog */}
      <ProfileViewDialog 
        profile={selectedProfileForView}
        open={showProfileView}
        onOpenChange={setShowProfileView}
        showActions={false}
      />
    </div>
  );
};

export default Dashboard;