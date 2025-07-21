import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, MessageCircle, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showProfilePrompt, setShowProfilePrompt] = useState(true);
  const [activeTab, setActiveTab] = useState("discover");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: "discover", label: "Discover", icon: Heart },
    { id: "likes", label: "Likes", icon: Users },
    { id: "matches", label: "Matches", icon: MessageCircle },
    { id: "profile", label: "Profile", icon: User, flash: showProfilePrompt },
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
                <p className="text-center text-muted-foreground">
                  Complete your profile to start discovering meaningful connections!
                </p>
              </CardContent>
            </Card>
          </div>
        );
      
      case "likes":
        return (
          <div className="p-6 text-center">
            <div className="mb-8">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">People Who Liked You</h2>
              <p className="text-muted-foreground">See who's interested in connecting</p>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No likes yet. Complete your profile to get started!
                </p>
              </CardContent>
            </Card>
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
            <div className="text-center mb-8">
              <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Your Profile</h2>
              <p className="text-muted-foreground">Let others get to know you</p>
            </div>
            <Button 
              onClick={() => navigate("/profile-setup")}
              className="w-full"
              size="lg"
            >
              Complete Your Profile
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Profile Completion Prompt */}
      {showProfilePrompt && (
        <div className="bg-primary/10 border-b border-primary/20 p-4">
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
                  <strong>Hi {user.user_metadata?.first_name || 'there'}!</strong> 👋
                </p>
                <p className="text-sm text-foreground">
                  Before you begin connecting with others, please complete your profile here to help us find your perfect MS community matches!
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfilePrompt(false)}
              className="flex-shrink-0"
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
                className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors relative ${
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${tab.flash && showProfilePrompt ? 'animate-pulse' : ''}`} />
                  {tab.flash && showProfilePrompt && (
                    <div className="absolute -inset-1 bg-red-500/20 rounded-full animate-ping"></div>
                  )}
                </div>
                <span className={`text-xs font-medium ${tab.flash && showProfilePrompt ? 'text-red-500 animate-pulse' : ''}`}>
                  {tab.label}
                </span>
                {tab.flash && showProfilePrompt && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-2 h-2 p-0 rounded-full animate-pulse"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;