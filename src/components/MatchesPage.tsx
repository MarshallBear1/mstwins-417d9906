import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { OptimizedButton } from "@/components/OptimizedComponents";
import { useToast } from "@/hooks/use-toast";

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
  const { user } = useAuth();
  const { toast } = useToast();

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
                  <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                    {likedProfile.first_name} {likedProfile.last_name}
                  </h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {likedProfile.ms_subtype && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                        {likedProfile.ms_subtype}
                      </span>
                    )}
                    {likedProfile.location && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
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
                  <OptimizedButton 
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
                          fetchLikes();
                          return;
                        }

                        // Check daily likes limit before creating like
                        const { data: canLike, error: limitError } = await supabase.rpc(
                          'check_and_increment_daily_likes',
                          { target_user_id: likedProfile.user_id }
                        );

                        if (limitError) {
                          console.error('❌ Error checking like limit:', limitError);
                          toast({
                            title: "Error",
                            description: "Failed to check like limit. Please try again.",
                            variant: "destructive"
                          });
                          return;
                        }

                        if (!canLike) {
                          console.log('❌ Daily like limit reached');
                          toast({
                            title: "Daily Limit Reached",
                            description: "You've reached your daily like limit. Try again tomorrow or get bonus likes!",
                            variant: "destructive"
                          });
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
                          toast({
                            title: "Error",
                            description: "Failed to like back. Please try again.",
                            variant: "destructive"
                          });
                          return;
                        }

                        console.log('✅ Liked back successfully!');
                        toast({
                          title: "Success!",
                          description: "You liked them back!"
                        });
                        fetchLikes();
                      } catch (error) {
                        console.error('❌ Exception during like back:', error);
                        toast({
                          title: "Error",
                          description: "An unexpected error occurred. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                    debounceMs={2000}
                  >
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Like Back
                  </OptimizedButton>
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Who Connected with You</h2>
        </div>
      </div>

      {/* Content - Only Likes */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderLikesContent()}
      </div>
    </div>
  );
};

export default MatchesPage;