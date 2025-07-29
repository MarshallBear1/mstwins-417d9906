import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/hooks/useHaptics';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  from_user_id?: string;
  created_at: string;
}

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const haptics = useHaptics();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const processedNotificationIds = useRef<Set<string>>(new Set());
  const notificationTimeoutRef = useRef<NodeJS.Timeout>();

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setBrowserNotificationsEnabled(true);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setBrowserNotificationsEnabled(granted);
      return granted;
    }

    return false;
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, message: string, type: string) => {
    if (!browserNotificationsEnabled || Notification.permission !== 'granted') {
      return;
    }

    const iconMap = {
      like: '💖',
      match: '🎉',
      message: '💬',
      default: '🔔'
    };

    const icon = iconMap[type as keyof typeof iconMap] || iconMap.default;

    const notification = new Notification(title, {
      body: message,
      icon: `/favicon.png`,
      badge: `/favicon.png`,
      tag: type,
      requireInteraction: true,
      data: { type }
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  }, [browserNotificationsEnabled]);

  // Check browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Fetch initial notifications with error handling and retry logic
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20); // REDUCED limit for faster loading

        if (error) {
          console.error('Error fetching notifications:', error);
          // Don't set empty array on error to prevent loss of existing notifications
          return;
        }

        if (data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();

    // Set up real-time subscription
    const subscription = supabase
      .channel('notifications')
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
          
          // Prevent duplicate processing
          if (processedNotificationIds.current.has(newNotification.id)) {
            console.log('Duplicate notification detected, skipping:', newNotification.id);
            return;
          }
          
          processedNotificationIds.current.add(newNotification.id);
          
          // Clear previous timeout to debounce rapid notifications
          if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
          }
          
          // Debounce notification processing
          notificationTimeoutRef.current = setTimeout(() => {
            // Add to notifications list
            setNotifications(prev => {
              // Check if notification already exists
              if (prev.some(n => n.id === newNotification.id)) {
                return prev;
              }
              return [newNotification, ...prev];
            });
            
            // Increment unread count only if not already in list
            setUnreadCount(prev => {
              // Double-check to avoid incrementing for duplicates
              const exists = notifications.some(n => n.id === newNotification.id);
              return exists ? prev : prev + 1;
            });
            
            // Only show UI feedback for high-priority notifications (like/match)
            if (newNotification.type === 'like' || newNotification.type === 'match') {
              // Show toast notification (debounced)
              toast({
                title: newNotification.title,
                description: newNotification.message,
              });

              // Trigger haptic feedback
              if (newNotification.type === 'match') {
                haptics.match();
              } else if (newNotification.type === 'like') {
                haptics.like();
              }

              // Show browser notification
              showBrowserNotification(
                newNotification.title,
                newNotification.message,
                newNotification.type
              );
            } else if (newNotification.type === 'message') {
              // More subtle feedback for messages
              haptics.message();
            }
          }, 300); // 300ms debounce for notification processing
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [user, toast, haptics, showBrowserNotification]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    // Update local state
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );

    // Decrease unread count
    setUnreadCount(prev => Math.max(0, prev - 1));

    return true;
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return false;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }

    // Update local state
    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true }))
    );
    setUnreadCount(0);

    return true;
  }, [user]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestNotificationPermission,
    browserNotificationsEnabled
  };
};