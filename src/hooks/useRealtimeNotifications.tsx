import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/hooks/useHaptics';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { useNativePushNotifications } from '@/hooks/useNativePushNotifications';

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
  const localNotifications = useLocalNotifications();
  const pushNotifications = useNativePushNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNative, setIsNative] = useState(false);

  // Check platform on mount
  useEffect(() => {
    const checkPlatform = async () => {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);
    };
    
    checkPlatform();
  }, []);

  // Fetch initial notifications and set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
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
        async (payload) => {
          const newNotification = payload.new as Notification;
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev]);
          
          // Increment unread count
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });

          // Trigger haptic feedback
          if (newNotification.type === 'match') {
            haptics.match();
          } else if (newNotification.type === 'like') {
            haptics.like();
          } else if (newNotification.type === 'message') {
            haptics.message();
          } else {
            haptics.successFeedback();
          }

          // Handle native notifications only
          if (isNative && localNotifications.isEnabled) {
            // Send native local notification
            try {
              if (newNotification.type === 'match') {
                await localNotifications.scheduleMatchNotification(
                  newNotification.title.replace('New match with ', '') || 'Someone'
                );
              } else if (newNotification.type === 'like') {
                await localNotifications.scheduleLikeNotification(
                  newNotification.title.replace('Someone liked your profile!', 'Someone') || 'Someone'
                );
              } else if (newNotification.type === 'message') {
                await localNotifications.scheduleMessageNotification(
                  'New Message',
                  newNotification.message
                );
              }
            } catch (error) {
              console.error('Error sending native notification:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]); // Only depend on user ID to prevent infinite loops

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

  // Native-only permission request
  const requestAllPermissions = useCallback(async () => {
    if (isNative) {
      const permissions = await pushNotifications.requestPermissions();
      return permissions || localNotifications.isEnabled;
    }
    return false; // No browser notifications supported
  }, [isNative, pushNotifications, localNotifications.isEnabled]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestAllPermissions,
    isNative,
    notificationsEnabled: isNative ? localNotifications.isEnabled : false
  };
};