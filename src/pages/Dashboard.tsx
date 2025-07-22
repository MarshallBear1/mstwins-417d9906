import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, MessageCircle, User, Edit, MapPin, Calendar, X, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import DiscoverProfiles from "@/components/DiscoverProfiles";
import Messaging from "@/components/Messaging";
import ProfileCard from "@/components/ProfileCard";
import ReferralDropdown from "@/components/ReferralDropdown";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  location: string;
  ms_subtype: string | null;
  diagnosis_year: number | null;
  symptoms: string[];
  medications: string[];
  hobbies: string[];
  avatar_url: string | null;
  about_me: string | null;
  last_seen: string | null;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("discover");
  const [likes, setLikes] = useState<Profile[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [showRobotNotification, setShowRobotNotification] = useState(() => {
    return !localStorage.getItem('robotNotificationDismissed');
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
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

      setProfile(data);
      
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

      setLikes(profiles || []);
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDismissRobotNotification = () => {
    setShowRobotNotification(false);
    localStorage.setItem('robotNotificationDismissed', 'true');
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
        return <DiscoverProfiles />;
      case "likes":
        return (
          <div className="p-6">
            <div className="text-center mb-6">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">People Who Liked You</h2>
              <p className="text-muted-foreground">See who's interested in connecting</p>
            </div>
            
            {likesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : likes.length > 0 ? (
              <div className="space-y-4">
                {likes.map((likedProfile) => (
                  <Card key={likedProfile.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-primary flex-shrink-0">
                          {likedProfile.avatar_url ? (
                            <img 
                              src={likedProfile.avatar_url} 
                              alt={`${likedProfile.first_name}'s avatar`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                              <User className="w-8 h-8 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {likedProfile.first_name} {likedProfile.last_name}
                          </h3>
                          
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="truncate">{likedProfile.location}</span>
                          </div>
                          
                          {likedProfile.date_of_birth && (
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Calendar className="w-4 h-4 mr-1" />
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
                            <Badge variant="secondary" className="mt-2">
                              {likedProfile.ms_subtype}
                            </Badge>
                          )}
                        </div>
                        
                         <div className="flex-shrink-0">
                           <Button 
                             size="sm" 
                             className="bg-gradient-primary hover:opacity-90 text-white"
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
                            <Heart className="w-4 h-4 mr-1" />
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
      {/* Header with notifications and referral */}
      <div className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-200 p-1 shadow-sm">
              <img src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" alt="MSTwins mascot" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-bold text-foreground">
              MS<span className="text-blue-600">Twins</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ReferralDropdown />
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* Robot notification - persistent dismissal */}
      {showRobotNotification && (
        <div className="bg-green-50 border-b border-green-200 p-4 animate-fade-in">
          <div className="flex items-start space-x-3">
            <img src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" alt="Helpful robot" className="w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="bg-white rounded-lg p-3 shadow-sm relative">
                <div className="absolute -left-2 top-3 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-white border-b-4 border-b-transparent"></div>
                <p className="text-sm text-foreground mb-2">
                  <strong>Great job, {profile.first_name}!</strong> 🎉
                </p>
                <p className="text-sm text-foreground">
                  You are ready to start swiping! Click Discover to see profiles and find your perfect MS community matches.
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismissRobotNotification} className="flex-shrink-0 p-1 h-auto">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default Dashboard;