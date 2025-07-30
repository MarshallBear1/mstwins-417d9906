import { useState } from "react";
import { Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Messaging from "@/components/Messaging";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Import the likes component from Dashboard
interface MatchesPageProps {
  likes: any[];
  likesLoading: boolean;
  fetchLikes: () => void;
  selectedProfileForView: any;
  setSelectedProfileForView: (profile: any) => void;
  setShowProfileView: (show: boolean) => void;
}

const MatchesPage = ({ 
  likes, 
  likesLoading, 
  fetchLikes, 
  selectedProfileForView, 
  setSelectedProfileForView, 
  setShowProfileView 
}: MatchesPageProps) => {
  const [activeSubTab, setActiveSubTab] = useState<'likes' | 'messages'>('likes');
  const { user } = useAuth();

  const subTabs = [
    { id: 'likes' as const, label: 'Who Liked You', icon: Users },
    { id: 'messages' as const, label: 'Messages', icon: MessageCircle },
  ];

  const renderLikesContent = () => {
    if (likesLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (likes.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No likes yet</h3>
          <p className="text-gray-500 text-sm">
            Keep discovering profiles - your matches will appear here!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 sm:space-y-4">
        {likes.map(likedProfile => (
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
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                    {likedProfile.first_name} {likedProfile.last_name}
                  </h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {likedProfile.ms_subtype && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {likedProfile.ms_subtype}
                      </span>
                    )}
                    {likedProfile.location && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        📍 {likedProfile.location}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex-shrink-0 flex flex-col gap-2 min-w-0 sm:min-w-[120px]">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm" 
                    onClick={() => {
                      setSelectedProfileForView(likedProfile);
                      setShowProfileView(true);
                    }}
                  >
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-primary hover:opacity-90 text-white text-xs sm:text-sm" 
                    onClick={async () => {
                      // Like back functionality (moved from Dashboard)
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
                        fetchLikes(); // Refresh the likes to show updated state
                      } catch (error) {
                        console.error('❌ Exception during like back:', error);
                      }
                    }}
                  >
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Like Back
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sub-tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeSubTab === 'likes' ? (
          <div className="h-full overflow-y-auto p-4">
            <div className="text-center mb-6">
              <Users className="w-12 sm:w-16 h-12 sm:h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-2">People Who Liked You</h2>
              <p className="text-sm sm:text-base text-muted-foreground">See who's interested in connecting</p>
            </div>
            {renderLikesContent()}
          </div>
        ) : (
          <Messaging />
        )}
      </div>
    </div>
  );
};

export default MatchesPage;