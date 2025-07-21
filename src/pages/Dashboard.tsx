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
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDismissRobotNotification = () => {
    setShowRobotNotification(false);
    localStorage.setItem('robotNotificationDismissed', 'true');
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
        return <DiscoverProfiles />;
      case "likes":
        return (
          <div className="p-6 text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">People Who Liked You</h2>
            <p className="text-muted-foreground">See who's interested in connecting</p>
            <Card className="mt-6">
              <CardContent className="p-6">
                <p className="text-muted-foreground">No likes yet. Start discovering!</p>
              </CardContent>
            </Card>
          </div>
        );
      case "matches":
        return <Messaging />;
      case "profile":
        return (
          <div className="p-6">
            <div className="max-w-md mx-auto">
              <Card className="overflow-hidden shadow-xl">
                <div className="relative h-48 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.first_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/profile-setup")} className="bg-white/80 hover:bg-white">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSignOut} className="bg-white/80 hover:bg-white text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h3>
                    {profile.date_of_birth && (
                      <span className="text-xl font-semibold text-muted-foreground">
                        {calculateAge(profile.date_of_birth)}
                      </span>
                    )}
                  </div>
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
                  {profile.hobbies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.hobbies.slice(0, 6).map((hobby, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700">
                            {hobby}
                          </Badge>
                        ))}
                      </div>
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
      {/* Header with notifications */}
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
          <NotificationBell />
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