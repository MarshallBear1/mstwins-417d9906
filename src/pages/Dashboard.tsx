import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, MessageCircle, User, Edit, MapPin, Calendar, X, LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("discover");
  const [showRobotNotification, setShowRobotNotification] = useState(true);
  const [likes, setLikes] = useState<any[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      if (activeTab === "likes") {
        fetchLikes();
      }
    }
  }, [user, activeTab]);

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
      // TODO: Implement when likes table is available
      // const { data, error } = await supabase
      //   .from('likes')
      //   .select(`
      //     id,
      //     created_at,
      //     liker_id,
      //     profiles!likes_liker_id_fkey (
      //       first_name,
      //       last_name,
      //       avatar_url,
      //       hobbies,
      //       ms_subtype,
      //       location
      //     )
      //   `)
      //   .eq('liked_id', user.id)
      //   .order('created_at', { ascending: false });

      // if (error) {
      //   console.error('Error fetching likes:', error);
      //   return;
      // }

      // setLikes(data || []);
      setLikes([]); // Placeholder until table exists
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setLikesLoading(false);
    }
  };

  const dismissLike = async (likeId: string) => {
    try {
      // TODO: Implement when likes table is available
      // const { error } = await supabase
      //   .from('likes')
      //   .delete()
      //   .eq('id', likeId);

      // if (error) {
      //   console.error('Error dismissing like:', error);
      //   return;
      // }

      setLikes(prev => prev.filter(like => like.id !== likeId));
    } catch (error) {
      console.error('Error dismissing like:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  // If no profile exists, redirect to profile setup
  if (!profile) {
    navigate("/profile-setup");
    return null;
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
                    More profiles will appear as new users join the MSTwins community. Check back later to find your perfect matches!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {/* Add refresh logic here */}}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh Profiles
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {/* Add review skipped logic here */}}
                      className="flex items-center gap-2"
                    >
                      <Heart className="w-4 h-4" />
                      Review Skipped
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    💡 Tip: Complete your profile to attract more meaningful connections
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case "likes":
        return (
          <div className="p-6">
            <div className="mb-8 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">People Who Liked You</h2>
              <p className="text-muted-foreground">See who's interested in connecting</p>
            </div>
            
            {likesLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : likes.length > 0 ? (
              <div className="space-y-4">
                {likes.map((like) => (
                  <Card key={like.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            {like.profiles.avatar_url ? (
                              <img 
                                src={like.profiles.avatar_url} 
                                alt={like.profiles.first_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <User className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{like.profiles.first_name} {like.profiles.last_name}</h3>
                            <p className="text-sm text-muted-foreground">{like.profiles.location}</p>
                            {like.profiles.ms_subtype && (
                              <p className="text-sm text-muted-foreground">{like.profiles.ms_subtype}</p>
                            )}
                            {like.profiles.hobbies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {like.profiles.hobbies.slice(0, 3).map((hobby, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {hobby}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dismissLike(like.id)}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {/* Add like back functionality */}}
                          >
                            Like Back
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    No likes yet. Start discovering to find your community!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      
      case "matches":
        return (
          <div className="p-6 text-center">
            <div className="mb-8">
              <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Your Matches</h2>
              <p className="text-muted-foreground">Chat with your connections</p>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No matches yet. Start discovering to find your community!
                </p>
              </CardContent>
            </Card>
          </div>
        );
      
      case "profile":
        return (
          <div className="p-6">
            {/* Profile Card */}
            <div className="max-w-md mx-auto">
              <Card className="overflow-hidden shadow-xl">
                {/* Avatar Section with Gradient Background */}
                <div className="relative h-48 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.first_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {/* Edit button */}
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/profile-setup")}
                      className="bg-white/80 hover:bg-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                      className="bg-white/80 hover:bg-white text-red-600 hover:text-red-700"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>

                {/* Profile Content */}
                <CardContent className="p-6 space-y-4">
                  {/* Name and Age */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h3>
                    {profile.date_of_birth && (
                      <span className="text-xl font-semibold text-muted-foreground">
                        {calculateAge(profile.date_of_birth)}
                      </span>
                    )}
                  </div>

                  {/* Location and Diagnosis */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{profile.location}</span>
                    </div>
                    {profile.diagnosis_year && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Diagnosed in {profile.diagnosis_year}</span>
                      </div>
                    )}
                  </div>

                  {/* MS Type */}
                  {profile.ms_subtype && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">MS Type</h4>
                      <span className="text-muted-foreground">{profile.ms_subtype}</span>
                    </div>
                  )}

                  {/* Interests */}
                  {profile.hobbies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.hobbies.slice(0, 6).map((hobby, index) => (
                          <Badge 
                            key={index}
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            {hobby}
                          </Badge>
                        ))}
                        {profile.hobbies.length > 6 && (
                          <Badge variant="outline">
                            +{profile.hobbies.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* About */}
                  {profile.about_me && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">About</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {profile.about_me}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Welcome Message */}
      {showRobotNotification && (
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="flex items-start space-x-3">
            <img 
              src="/lovable-uploads/4872045b-6fa1-4c2c-b2c9-cba6d4add944.png" 
              alt="Helpful avatar"
              className="w-12 h-12 rounded-full flex-shrink-0"
            />
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRobotNotification(false)}
              className="flex-shrink-0 p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 pb-20">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="flex items-center justify-around py-2 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;