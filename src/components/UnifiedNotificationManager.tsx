import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useToast } from '@/hooks/use-toast';

interface NotificationEvent {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  from_user_id?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationCache {
  [key: string]: {
    lastSent: number;
    count: number;
  };
}

// Global cache to prevent duplicates across all notification systems
const notificationCache = useRef<NotificationCache>({});
const DEDUP_WINDOW = 10000; // 10 seconds
const MAX_NOTIFICATIONS_PER_WINDOW = 3;

const UnifiedNotificationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isNative, setIsNative] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const realtimeChannelRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Platform detection
  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    
    console.log('🔔 Unified Notification Manager initialized:', {
      isNative: native,
      user: !!user
    });
  }, []);

  // Request permissions once for native platforms
  useEffect(() => {
    if (!user || !isNative || permissionsGranted) return;

    const requestAllPermissions = async () => {
      try {
        console.log('📱 Requesting native notification permissions...');
        
        // Request local notification permissions
        const localPermResult = await LocalNotifications.requestPermissions();
        
        // Request push notification permissions
        const pushPermResult = await PushNotifications.requestPermissions();
        
        if (localPermResult.display === 'granted' || pushPermResult.receive === 'granted') {
          console.log('✅ Notification permissions granted');
          setPermissionsGranted(true);
          
          // Register for push notifications
          await PushNotifications.register();
          
          // Set up push token handling
          PushNotifications.addListener('registration', async (token) => {
            console.log('📱 Push token received:', token.value);
            await savePushToken(token.value);
          });

          // Set up notification listeners
          setupNotificationListeners();
        } else {
          console.log('❌ Notification permissions denied');
        }
      } catch (error) {
        console.error('❌ Error requesting permissions:', error);
      }
    };

    requestAllPermissions();
  }, [user, isNative, permissionsGranted]);

  // Save push token to database
  const savePushToken = async (token: string) => {
    if (!user) return;
    
    try {
      const platform = Capacitor.getPlatform();
      await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform,
          updated_at: new Date().toISOString()
        });
      console.log('✅ Push token saved');
    } catch (error) {
      console.error('❌ Error saving push token:', error);
    }
  };

  // Deduplication logic
  const shouldSendNotification = (notificationKey: string): boolean => {
    const now = Date.now();
    const cache = notificationCache.current;
    
    if (!cache[notificationKey]) {
      cache[notificationKey] = { lastSent: now, count: 1 };
      return true;
    }
    
    const timeSinceLastSent = now - cache[notificationKey].lastSent;
    
    if (timeSinceLastSent > DEDUP_WINDOW) {
      // Reset window
      cache[notificationKey] = { lastSent: now, count: 1 };
      return true;
    }
    
    if (cache[notificationKey].count >= MAX_NOTIFICATIONS_PER_WINDOW) {
      console.log('🚫 Notification throttled:', notificationKey);
      return false;
    }
    
    cache[notificationKey].count++;
    return true;
  };

  // Send local notification (deduplicated)
  const sendLocalNotification = async (notification: NotificationEvent) => {
    if (!isNative || !permissionsGranted) return;
    
    const notificationKey = `${notification.type}_${notification.from_user_id}_${notification.user_id}`;
    
    if (!shouldSendNotification(notificationKey)) {
      return;
    }
    
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: parseInt(notification.id.slice(-8), 16), // Convert to number
          title: notification.title,
          body: notification.message,
          schedule: { at: new Date(Date.now() + 100) }, // Immediate
          sound: 'default',
          actionTypeId: 'OPEN_APP',
          extra: {
            type: notification.type,
            from_user_id: notification.from_user_id,
            notification_id: notification.id
          }
        }]
      });
      
      // Add haptic feedback
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
      
      console.log('📱 Local notification sent:', notification.title);
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  };

  // Send toast notification (deduplicated)
  const sendToastNotification = (notification: NotificationEvent) => {
    const notificationKey = `toast_${notification.type}_${notification.from_user_id}_${notification.user_id}`;
    
    if (!shouldSendNotification(notificationKey)) {
      return;
    }
    
    toast({
      title: notification.title,
      description: notification.message,
      duration: 4000,
    });
  };

  // Set up notification action listeners
  const setupNotificationListeners = () => {
    if (!isNative) return;
    
    // Handle notification tap
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('📱 Notification tapped:', notification);
      
      const data = notification.notification.data;
      if (data?.type === 'like' || data?.type === 'match') {
        window.location.href = '/dashboard?tab=discover';
      } else if (data?.type === 'message') {
        window.location.href = '/dashboard?tab=matches';
      }
    });

    // Handle local notification tap
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('📱 Local notification tapped:', notification);
      
      const extra = notification.notification.extra;
      if (extra?.type === 'like' || extra?.type === 'match') {
        window.location.href = '/dashboard?tab=discover';
      } else if (extra?.type === 'message') {
        window.location.href = '/dashboard?tab=matches';
      }
    });
  };

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      const unreadCount = data?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unreadCount);
      
      console.log('📬 Fetched notifications:', data?.length, 'unread:', unreadCount);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  };

  // Set up realtime subscription (singleton)
  useEffect(() => {
    if (!user || isInitializedRef.current) return;

    fetchNotifications();
    
    console.log('🔄 Setting up realtime notification subscription...');
    
    realtimeChannelRef.current = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('🔔 New notification received:', payload);
          
          const newNotification = payload.new as NotificationEvent;
          
          // Update local state
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Send appropriate notifications based on platform and type
          if (isNative) {
            await sendLocalNotification(newNotification);
          } else {
            sendToastNotification(newNotification);
          }
          
          // Fetch user profile for enhanced notification
          if (newNotification.from_user_id) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('user_id', newNotification.from_user_id)
                .single();
              
              if (profile?.first_name) {
                console.log('📝 Enhanced notification with profile:', profile.first_name);
              }
            } catch (error) {
              console.error('❌ Error fetching profile for notification:', error);
            }
          }
        }
      )
      .subscribe();

    isInitializedRef.current = true;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [user, isNative, permissionsGranted]);

  // Mark notification as read
  const markAsRead = async (notificationId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);

      return true;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return false;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  // This component doesn't render anything, it just manages notifications
  return null;
};

export default UnifiedNotificationManager;
export type { NotificationEvent };