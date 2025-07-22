import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  from_user_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setBrowserNotificationsEnabled(true);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      const enabled = permission === 'granted';
      setBrowserNotificationsEnabled(enabled);
      return enabled;
    }

    return false;
  };

  // Show browser notification
  const showBrowserNotification = (title: string, message: string, type: string) => {
    if (!browserNotificationsEnabled || Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body: message,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: `ms-dating-${type}`,
      requireInteraction: false,
      silent: false,
    };

    // Add custom icon based on notification type
    if (type === 'match') {
      options.icon = '💕';
    } else if (type === 'like') {
      options.icon = '❤️';
    } else if (type === 'message') {
      options.icon = '💬';
    }

    const notification = new window.Notification(title, options);
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Optional: Handle click to focus the app
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  // Check permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setBrowserNotificationsEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch existing notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && !error) {
        setNotifications(data);
        const unread = data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    };

    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel(`notifications-${user.id}`, {
        config: {
          broadcast: { self: true },
          presence: { key: user.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Prevent duplicate notifications with better logic
          setNotifications(prev => {
            const exists = prev.some(n => 
              n.id === newNotification.id || 
              (n.type === newNotification.type && 
               n.from_user_id === newNotification.from_user_id && 
               n.user_id === newNotification.user_id &&
               Math.abs(new Date(n.created_at).getTime() - new Date(newNotification.created_at).getTime()) < 5000) // Within 5 seconds
            );
            if (exists) {
              console.log('Duplicate notification prevented:', newNotification);
              return prev;
            }
            
            // Show toast notification only for new notifications
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 4000,
            });

            // Show browser notification
            showBrowserNotification(newNotification.title, newNotification.message, newNotification.type);

            // Play notification sound (optional)
            try {
              const audio = new Audio('/notification-sound.mp3');
              audio.volume = 0.3;
              audio.play().catch(() => {}); // Ignore if sound fails
            } catch (error) {
              // Ignore sound errors
            }
            
            return [newNotification, ...prev];
          });
          
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user?.id);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestNotificationPermission,
    browserNotificationsEnabled
  };
};