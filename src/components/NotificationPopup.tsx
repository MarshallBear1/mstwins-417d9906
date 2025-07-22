import { useEffect, useState } from "react";
import { X, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { supabase } from "@/integrations/supabase/client";

const NotificationPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const { notifications } = useRealtimeNotifications();

  useEffect(() => {
    // Check for new like or match notifications
    const latestNotification = notifications.find(
      n => (n.type === 'like' || n.type === 'match') && 
           !n.is_read && 
           !dismissedNotifications.has(n.id)
    );

    if (latestNotification && latestNotification.id !== currentNotification?.id) {
      setCurrentNotification(latestNotification);
      setIsVisible(true);
    }
  }, [notifications, dismissedNotifications]);

  const fetchFromUserProfile = async (fromUserId: string) => {
    if (!fromUserId) return null;
    
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('user_id', fromUserId)
      .single();
    
    return data;
  };

  const [fromUserProfile, setFromUserProfile] = useState<any>(null);

  useEffect(() => {
    if (currentNotification?.from_user_id) {
      fetchFromUserProfile(currentNotification.from_user_id).then(setFromUserProfile);
    }
  }, [currentNotification]);

  const handleDismiss = () => {
    if (currentNotification) {
      setDismissedNotifications(prev => new Set([...prev, currentNotification.id]));
    }
    setIsVisible(false);
    setCurrentNotification(null);
    setFromUserProfile(null);
  };

  if (!isVisible || !currentNotification) return null;

  const isMatch = currentNotification.type === 'match';
  const isLike = currentNotification.type === 'like';

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <Card className="w-80 max-w-[calc(100vw-2rem)] shadow-xl border-0 bg-background/95 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Robot mascot */}
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                alt="MSTwins robot" 
                className="w-12 h-12 rounded-full"
              />
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <div className="bg-white rounded-lg p-3 shadow-sm relative">
                <div className="absolute -left-2 top-3 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-white border-b-4 border-b-transparent"></div>
                
                <div className="flex items-center gap-2 mb-2">
                  {isMatch && <Users className="w-5 h-5 text-green-500" />}
                  {isLike && <Heart className="w-5 h-5 text-pink-500" fill="currentColor" />}
                  <p className="text-sm font-semibold text-foreground">
                    {isMatch ? '🎉 New Match!' : '💕 Someone Liked You!'}
                  </p>
                </div>
                
                {fromUserProfile && (
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={fromUserProfile.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {fromUserProfile.first_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground">
                      {fromUserProfile.first_name} {fromUserProfile.last_name}
                    </span>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">
                  {isMatch 
                    ? "You both liked each other! Start chatting now." 
                    : "Check out your Likes to see who's interested in connecting!"
                  }
                </p>
              </div>
            </div>
            
            {/* Dismiss button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPopup;