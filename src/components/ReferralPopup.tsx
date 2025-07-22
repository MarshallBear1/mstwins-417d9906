import { useState, useEffect } from "react";
import { X, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const ReferralPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Only show popup for authenticated users
    if (user) {
      const storageKey = `referral_popup_count_${user.id}`;
      const currentCount = parseInt(localStorage.getItem(storageKey) || '0');
      
      // Only show if user hasn't seen it 3 times already
      if (currentCount < 3) {
        // Show first popup after 5 minutes (300000ms)
        const firstTimeout = setTimeout(() => {
          setIsVisible(true);
          // Increment counter when showing popup
          localStorage.setItem(storageKey, (currentCount + 1).toString());
        }, 300000);

        // Then show every 30 minutes (1800000ms) if count is still less than 3
        const interval = setInterval(() => {
          const updatedCount = parseInt(localStorage.getItem(storageKey) || '0');
          if (updatedCount < 3) {
            setIsVisible(true);
            localStorage.setItem(storageKey, (updatedCount + 1).toString());
          } else {
            clearInterval(interval);
          }
        }, 1800000);

        return () => {
          clearTimeout(firstTimeout);
          clearInterval(interval);
        };
      }
    }
  }, [user]);

  useEffect(() => {
    // Fetch user profile for avatar
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from('profiles')
        .select('first_name, avatar_url')
        .eq('user_id', user?.id)
        .single();
      
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const copyReferralLink = async () => {
    const referralLink = `${window.location.origin}?ref=${user?.id}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link copied!",
        description: "Share it with friends to help grow our community!",
      });
      setIsVisible(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
      });
    }
  };

  if (!isVisible || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card className="w-80 mx-4 shadow-2xl border-0 bg-background/95 backdrop-blur-md animate-scale-in">
        <CardHeader className="text-center space-y-4">
          <div className="relative mx-auto">
            <Avatar className="w-16 h-16 mx-auto border-4 border-primary/20">
              <AvatarImage src={userProfile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {userProfile?.first_name?.[0] || user.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Animated sparkles around avatar */}
            <div className="absolute -inset-4 animate-pulse">
              <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-yellow-400" />
              <Sparkles className="absolute -bottom-2 -left-2 w-3 h-3 text-blue-400" />
              <Sparkles className="absolute top-1/2 -left-4 w-3 h-3 text-purple-400" />
              <Sparkles className="absolute -top-2 left-1/2 w-3 h-3 text-pink-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-xl">Help Us Grow! 💙</CardTitle>
            <p className="text-sm text-muted-foreground">
              Would you share MSTwins with friends who could benefit from our supportive MS community?
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border text-center">
            <p className="text-sm text-muted-foreground">
              Your referral helps others find support and connection on their MS journey
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={copyReferralLink}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsVisible(false)}
              className="px-3"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              🤝 Building connections • 💙 MS support network
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralPopup;