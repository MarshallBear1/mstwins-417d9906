import { useEffect, useState, useCallback } from 'react';
import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface LocalNotificationOptions {
  title: string;
  body: string;
  id?: number;
  schedule?: {
    at: Date;
    repeats?: boolean;
    every?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
  };
  sound?: string;
  attachments?: Array<{
    id: string;
    url: string;
    options?: any;
  }>;
  actionTypeId?: string;
  extra?: any;
  iconColor?: string;
  ongoing?: boolean;
  autoCancel?: boolean;
  largeBody?: string;
  summaryText?: string;
  smallIcon?: string;
  largeIcon?: string;
  channelId?: string;
}

export const useLocalNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus['display']>('prompt');

  useEffect(() => {
    setIsSupported(Capacitor.isNativePlatform());
    
    let cleanup: (() => void) | undefined;
    
    if (Capacitor.isNativePlatform()) {
      initializeLocalNotifications().then((cleanupFn) => {
        cleanup = cleanupFn;
      });
    }

    // Cleanup listeners when component unmounts
    return () => {
      if (cleanup) {
        cleanup();
      }
      // Remove all listeners on unmount to prevent memory leaks
      LocalNotifications.removeAllListeners().catch(console.error);
    };
  }, []);

  const initializeLocalNotifications = async () => {
    try {
      // Check current permissions
      const permissions = await LocalNotifications.checkPermissions();
      setPermissionStatus(permissions.display);

      // Remove any existing listeners to prevent duplicates
      await LocalNotifications.removeAllListeners();

      // Listen for local notification actions
      const actionListener = await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Local notification action performed:', notification);
        // Handle notification actions here
      });

      const receivedListener = await LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('Local notification received:', notification);
        // Handle received local notifications
      });

      // Store listeners for cleanup
      return () => {
        actionListener?.remove();
        receivedListener?.remove();
      };

      // Create notification channels for Android
      if (Capacitor.getPlatform() === 'android') {
        await LocalNotifications.createChannel({
          id: 'mstwins-general',
          name: 'General Notifications',
          description: 'General app notifications',
          sound: 'default',
          importance: 4,
          vibration: true,
          lights: true,
          lightColor: '#2563eb'
        });

        await LocalNotifications.createChannel({
          id: 'mstwins-matches',
          name: 'Matches & Likes',
          description: 'Notifications for matches and likes',
          sound: 'default',
          importance: 5,
          vibration: true,
          lights: true,
          lightColor: '#10b981'
        });

        await LocalNotifications.createChannel({
          id: 'mstwins-messages',
          name: 'Messages',
          description: 'New message notifications',
          sound: 'default',
          importance: 5,
          vibration: true,
          lights: true,
          lightColor: '#3b82f6'
        });
      }
    } catch (error) {
      console.error('Error initializing local notifications:', error);
    }
  };

  const requestPermissions = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Local notifications are only available on mobile devices.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      setPermissionStatus(result.display);
      
      if (result.display === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive local notifications!",
        });
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your device settings.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting local notification permissions:', error);
      return false;
    }
  }, [isSupported, toast]);

  const scheduleNotification = useCallback(async (options: LocalNotificationOptions) => {
    if (!isSupported || permissionStatus !== 'granted') {
      console.warn('Local notifications not available or not permitted');
      return false;
    }

    try {
      const id = options.id || Math.floor(Math.random() * 1000000);
      
      const notificationOptions = {
        notifications: [{
          title: options.title,
          body: options.body,
          id,
          schedule: options.schedule,
          sound: options.sound || 'default',
          attachments: options.attachments,
          actionTypeId: options.actionTypeId,
          extra: options.extra,
          iconColor: options.iconColor || '#2563eb',
          ongoing: options.ongoing || false,
          autoCancel: options.autoCancel !== false,
          largeBody: options.largeBody,
          summaryText: options.summaryText,
          smallIcon: options.smallIcon || 'ic_stat_icon_config_sample',
          largeIcon: options.largeIcon,
          channelId: options.channelId || 'mstwins-general'
        }]
      };

      await LocalNotifications.schedule(notificationOptions);
      console.log('Local notification scheduled:', id);
      return id;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return false;
    }
  }, [isSupported, permissionStatus]);

  const cancelNotification = useCallback(async (id: number) => {
    if (!isSupported) return false;

    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
      console.log('Local notification cancelled:', id);
      return true;
    } catch (error) {
      console.error('Error cancelling local notification:', error);
      return false;
    }
  }, [isSupported]);

  const cancelAllNotifications = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const pending = await LocalNotifications.getPending();
      const delivered = await LocalNotifications.getDeliveredNotifications();
      
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
      
      if (delivered.notifications.length > 0) {
        await LocalNotifications.removeDeliveredNotifications({ notifications: delivered.notifications });
      }
      
      console.log('All local notifications cancelled');
      return true;
    } catch (error) {
      console.error('Error cancelling all local notifications:', error);
      return false;
    }
  }, [isSupported]);

  // App-specific notification methods
  const scheduleMatchNotification = useCallback((matchUserName: string) => {
    return scheduleNotification({
      title: 'New Match! 🎉',
      body: `You matched with ${matchUserName}! Start chatting now.`,
      channelId: 'mstwins-matches',
      iconColor: '#10b981',
      extra: { type: 'match', userName: matchUserName }
    });
  }, [scheduleNotification]);

  const scheduleLikeNotification = useCallback((likerName: string) => {
    return scheduleNotification({
      title: 'Someone likes you! 💙',
      body: `${likerName} liked your profile. Check it out!`,
      channelId: 'mstwins-matches',
      iconColor: '#3b82f6',
      extra: { type: 'like', userName: likerName }
    });
  }, [scheduleNotification]);

  const scheduleMessageNotification = useCallback((senderName: string, message: string) => {
    return scheduleNotification({
      title: `New message from ${senderName}`,
      body: message.length > 50 ? message.substring(0, 50) + '...' : message,
      channelId: 'mstwins-messages',
      iconColor: '#3b82f6',
      extra: { type: 'message', senderName, message }
    });
  }, [scheduleNotification]);

  const scheduleReminderNotification = useCallback((title: string, body: string, scheduleAt: Date) => {
    return scheduleNotification({
      title,
      body,
      schedule: { at: scheduleAt },
      channelId: 'mstwins-general',
      extra: { type: 'reminder' }
    });
  }, [scheduleNotification]);

  return {
    isSupported,
    permissionStatus,
    isEnabled: permissionStatus === 'granted',
    requestPermissions,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    // App-specific methods
    scheduleMatchNotification,
    scheduleLikeNotification,
    scheduleMessageNotification,
    scheduleReminderNotification
  };
};