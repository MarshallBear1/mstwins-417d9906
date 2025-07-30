import { useState, useEffect, useCallback } from "react";
import { Bell, Heart, Users, MessageCircle, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useNotificationOptimization, useNotificationPerformanceMonitor } from "@/hooks/useNotificationOptimization";
import { OptimizedButton } from "@/components/OptimizedComponents";

const NotificationBell = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use optimized notification hooks
  const { 
    subscribe, 
    markAsReadOptimized, 
    markAllAsReadOptimized,
    fetchNotifications 
  } = useNotificationOptimization();
  
  const { startTimer, endTimer } = useNotificationPerformanceMonitor();
  
  const {
    requestAllPermissions,
    notificationsEnabled
  } = useRealtimeNotifications();

  // Subscribe to optimized notification updates
  useEffect(() => {
    const unsubscribe = subscribe((cache) => {
      setNotifications(cache.data);
      setUnreadCount(cache.unreadCount);
    });

    // Initial fetch
    fetchNotifications().catch(console.error);

    return unsubscribe;
  }, [subscribe, fetchNotifications]);

  // Detect iOS/iPhone - browser notifications don't work properly on iOS
  const isIOS = () => {
    return Capacitor.getPlatform() === 'ios' || 
           /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  const isNativePlatform = () => {
    return Capacitor.isNativePlatform();
  };

  const handleEnableBrowserNotifications = async () => {
    if (isNativePlatform()) {
      toast({
        title: "Native Notifications Active",
        description: "Notifications work automatically through the app on mobile devices. No browser setup needed!",
        variant: "default"
      });
      return;
    }

    if (isIOS()) {
      toast({
        title: "Use Native App",
        description: "For best notification experience on iPhone, use the native app from the App Store.",
        variant: "default"
      });
      return;
    }

    const enabled = await requestAllPermissions();
    if (enabled) {
      toast({
        title: "Browser notifications enabled",
        description: "You'll now receive notifications even when the app is closed."
      });
    } else {
      toast({
        title: "Browser notifications blocked",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive"
      });
    }
  };
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />;
      case 'match':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };
  const handleNotificationClick = useCallback(async (notification: any) => {
    startTimer();
    
    if (!notification.is_read) {
      await markAsReadOptimized(notification.id);
    }
    
    // Navigate to appropriate tab based on notification type
    switch (notification.type) {
      case 'like':
        navigate('/dashboard?tab=likes');
        break;
      case 'match':
        navigate('/dashboard?tab=messages');
        break;
      case 'message':
        navigate('/dashboard?tab=messages');
        break;
      default:
        navigate('/dashboard');
        break;
    }
    
    // Close the notifications panel
    setShowNotifications(false);
    endTimer('notification_click');
  }, [navigate, markAsReadOptimized, startTimer, endTimer]);

  const handleMarkAllAsRead = useCallback(async () => {
    startTimer();
    await markAllAsReadOptimized();
    endTimer('mark_all_read');
  }, [markAllAsReadOptimized, startTimer, endTimer]);
  return (
    <>
      {/* Modern notification bell button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative text-gray-600 hover:text-gray-900 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex-shrink-0 rounded-full transition-all duration-200" 
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg animate-pulse" 
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Modern notification panel */}
      {showNotifications && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 w-[calc(100vw-1rem)] max-w-sm sm:absolute sm:top-14 sm:right-0 sm:left-auto sm:translate-x-0 sm:w-80 z-[101] mx-auto">
          <Card className="border-0 shadow-2xl bg-white backdrop-blur-xl rounded-2xl overflow-hidden max-h-[70vh] sm:max-h-none animate-in slide-in-from-top-2 fade-in duration-200">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <OptimizedButton 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2 rounded-lg font-medium"
                      debounceMs={1000}
                    >
                      Mark all read
                    </OptimizedButton>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowNotifications(false)}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-full max-h-[calc(70vh-80px)]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
                    <p className="text-xs text-gray-400 mt-1">We'll notify you when something happens!</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                                                 className={cn(
                           "p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
                           !notification.is_read && "bg-blue-50/50"
                         )}
                         onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            notification.type === 'like' && "bg-pink-100 text-pink-600",
                            notification.type === 'match' && "bg-green-100 text-green-600",
                            notification.type === 'message' && "bg-blue-100 text-blue-600"
                          )}>
                            {notification.type === 'like' && <Heart className="w-4 h-4" />}
                            {notification.type === 'match' && <Users className="w-4 h-4" />}
                            {notification.type === 'message' && <MessageCircle className="w-4 h-4" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                                                     
                           {!notification.is_read && (
                             <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
export default NotificationBell;