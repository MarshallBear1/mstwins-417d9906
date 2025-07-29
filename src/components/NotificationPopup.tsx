import { useEffect, useState, useCallback, useRef } from "react";
import { X, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { supabase } from "@/integrations/supabase/client";

const NotificationPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [notificationQueue, setNotificationQueue] = useState<any[]>([]);
  const [lastShownNotificationId, setLastShownNotificationId] = useState<string | null>(null);
  const { notifications, markAsRead } = useRealtimeNotifications();
  const { getNotificationSettings } = useNotificationPreferences();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const autoHideTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced notification processing - FIXED: prevent infinite loops
  const processNotificationQueue = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      // CRITICAL FIX: Only process if not currently showing a notification
      if (isVisible) return;

      // Get new notifications that haven't been shown yet
      const newNotifications = notifications.filter(
        n => (n.type === 'like' || n.type === 'match') && 
             !n.is_read && 
             !dismissedNotifications.has(n.id) &&
             n.id !== lastShownNotificationId
      );

      if (newNotifications.length > 0) {
        // Filter based on user preferences
        const allowedNotifications = newNotifications.filter(n => {
          const notificationType = n.type as 'like' | 'match' | 'message';
          const settings = getNotificationSettings(notificationType);
          return settings.enablePopups;
        });

        if (allowedNotifications.length === 0) return;

        // Sort by priority: matches first, then likes, then by creation time
        const sortedNotifications = allowedNotifications.sort((a, b) => {
          if (a.type === 'match' && b.type !== 'match') return -1;
          if (b.type === 'match' && a.type !== 'match') return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        const nextNotification = sortedNotifications[0];
        setCurrentNotification(nextNotification);
        setLastShownNotificationId(nextNotification.id);
        setNotificationQueue(sortedNotifications.slice(1));
        setIsVisible(true);

        // FIXED: Shorter auto-hide times to prevent overlap
        const autoHideDelay = nextNotification.type === 'match' ? 6000 : 4000;
        autoHideTimeoutRef.current = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);
      }
    }, 1000); // INCREASED debounce to prevent rapid firing
  }, [notifications, dismissedNotifications, isVisible, lastShownNotificationId, getNotificationSettings]);

  useEffect(() => {
    processNotificationQueue();
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };
  }, [processNotificationQueue]);

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

  const handleDismiss = useCallback(async () => {
    // Clear auto-hide timeout
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
    }

    if (currentNotification) {
      // Mark notification as read in database
      await markAsRead(currentNotification.id);
      setDismissedNotifications(prev => new Set([...prev, currentNotification.id]));
    }
    
    setIsVisible(false);
    setCurrentNotification(null);
    setFromUserProfile(null);
    
    // Process next notification in queue after a short delay
    setTimeout(() => {
      if (notificationQueue.length > 0) {
        const nextNotification = notificationQueue[0];
        setCurrentNotification(nextNotification);
        setLastShownNotificationId(nextNotification.id);
        setNotificationQueue(prev => prev.slice(1));
        setIsVisible(true);
        
        // Auto-hide for the next notification
        const autoHideDelay = nextNotification.type === 'match' ? 12000 : 8000;
        autoHideTimeoutRef.current = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);
      }
    }, 1000); // 1 second delay between notifications
  }, [currentNotification, markAsRead, notificationQueue]);

  if (!isVisible || !currentNotification) return null;

  const isMatch = currentNotification.type === 'match';
  const isLike = currentNotification.type === 'like';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-scale-in px-4 sm:inset-auto sm:top-4 sm:right-4 sm:justify-end sm:items-start">
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