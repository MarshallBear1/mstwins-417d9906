import { useState, useEffect } from "react";
import { Bell, Heart, MessageCircle, Users, X, Check, HandHeart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";

interface Notification {
  id: string;
  type: 'match' | 'like' | 'message' | 'connection' | 'forum_post' | 'forum_comment' | 'comment_reply';
  title: string;
  message: string;
  is_read: boolean;
  from_user_id?: string;
  from_user?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  created_at: string;
}

interface MatchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  matchUser: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    ms_subtype?: string;
  } | null;
}

const MatchPopup = ({ isOpen, onClose, matchUser }: MatchPopupProps) => {
  if (!matchUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 border-0 text-white">
        <div className="text-center p-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
            <div className="relative w-24 h-24 mx-auto">
              <Avatar className="w-24 h-24 border-4 border-white/50">
                <AvatarImage src={matchUser.avatar_url || undefined} />
                <AvatarFallback className="bg-white/20 text-white text-xl">
                  {matchUser.first_name[0]}{matchUser.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                <HandHeart className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">It's a Connection! 🎉</h2>
          <p className="text-white/90 mb-1">
            You and <span className="font-semibold">{matchUser.first_name}</span> both said hi!
          </p>
          {matchUser.ms_subtype && (
            <p className="text-white/70 text-sm mb-4">
              {matchUser.ms_subtype} • Ready to connect
            </p>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={() => {
                onClose();
                // Navigate to messages
                window.location.href = '/dashboard?tab=messages';
              }}
              className="w-full bg-white text-purple-600 hover:bg-gray-100 font-semibold py-3 rounded-xl"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Chatting
            </Button>
            <Button 
              onClick={onClose}
              variant="ghost" 
              className="w-full text-white hover:bg-white/10 py-3 rounded-xl"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ModernNotificationSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isMobile } = useMobileOptimizations();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [matchUser, setMatchUser] = useState<any>(null);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      // Load notifications without join (some relations are not defined in types)
      const { data: notifs, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const list = notifs || [];

      // Fetch sender profiles if any
      const senderIds = Array.from(new Set(list.map(n => n.from_user_id).filter(Boolean))) as string[];
      let sendersById = new Map<string, any>();
      if (senderIds.length > 0) {
        const { data: senders } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', senderIds);
        sendersById = new Map((senders || []).map(s => [s.user_id, s]));
      }

      const mapped: Notification[] = list.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        is_read: n.is_read,
        from_user_id: n.from_user_id || undefined,
        from_user: n.from_user_id ? sendersById.get(n.from_user_id) || undefined : undefined,
        created_at: n.created_at,
      }));

      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match':
      case 'connection':
        return <HandHeart className="w-4 h-4 text-green-500" />;
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'match':
      case 'connection':
        return 'bg-green-50 border-green-200';
      case 'like':
        return 'bg-red-50 border-red-200';
      case 'message':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Listen for real-time notifications
  useEffect(() => {
    if (!user) return;

    loadNotifications();

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as Notification;
        
        // Show match popup for new matches
        if (newNotification.type === 'match' && newNotification.from_user_id) {
          // Fetch user details for match popup
          supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, ms_subtype')
            .eq('user_id', newNotification.from_user_id)
            .single()
            .then(({ data }) => {
              if (data) {
                setMatchUser(data);
                setShowMatchPopup(true);
              }
            });
        }

        // Add to notifications list
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show toast notification
        toast({
          title: newNotification.title,
          description: newNotification.message,
          duration: 5000,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return (
    <>
      {/* Notification Bell */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="lg" 
            className="relative p-3 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-sm"
          >
            <Bell className="w-6 h-6 text-gray-600" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 w-6 h-6 p-0 text-xs bg-red-500 text-white rounded-full flex items-center justify-center animate-pulse shadow-lg notification-badge"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className={`${isMobile ? 'max-w-[95vw]' : 'max-w-md'} max-h-[80vh] p-0 flex flex-col`}>
          <DialogHeader className="p-4 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">Notifications</DialogTitle>
              {unreadCount > 0 && (
                <Button 
                  onClick={markAllAsRead}
                  variant="ghost" 
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(80vh - 80px)' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  You'll see updates about connections and messages here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <Card 
                    key={notification.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] border ${
                      !notification.is_read 
                        ? getNotificationColor(notification.type)
                        : 'bg-white border-gray-100'
                    } ios-bounce`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Notification clicked:', notification.type);
                      
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                      
                      // Close notifications first
                      setShowNotifications(false);
                      
                      // Handle navigation based on notification type
                      setTimeout(() => {
                        if (notification.type === 'message') {
                          window.location.href = '/dashboard?tab=messages';
                        } else if (notification.type === 'match' || notification.type === 'connection' || notification.type === 'like') {
                          window.location.href = '/dashboard?tab=likes';
                        }
                      }, 100);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {notification.from_user ? (
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={notification.from_user.avatar_url || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm">
                                {notification.from_user.first_name[0]}{notification.from_user.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 leading-tight">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatDistanceToNow(new Date(notification.created_at))} ago
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              {getNotificationIcon(notification.type)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Match Popup */}
      <MatchPopup 
        isOpen={showMatchPopup}
        onClose={() => setShowMatchPopup(false)}
        matchUser={matchUser}
      />
    </>
  );
};

export default ModernNotificationSystem;
