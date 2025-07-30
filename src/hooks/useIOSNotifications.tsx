import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useIOSNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const checkSupport = () => {
      const supported = Capacitor.isNativePlatform() && 
                       (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android');
      setIsSupported(supported);
    };

    checkSupport();
  }, []);

  const requestPermissions = async () => {
    try {
      // Request push notification permissions
      const pushPermission = await PushNotifications.requestPermissions();
      
      // Request local notification permissions
      const localPermission = await LocalNotifications.requestPermissions();
      
      if (pushPermission.receive === 'granted' && localPermission.display === 'granted') {
        setPermissionStatus('granted');
        await registerForNotifications();
        return true;
      } else {
        setPermissionStatus('denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setPermissionStatus('denied');
      return false;
    }
  };

  const registerForNotifications = async () => {
    if (!user) return;

    try {
      // Register for push notifications
      await PushNotifications.register();
      
      console.log('Successfully registered for push notifications');
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const savePushToken = async (token: string, platform: string) => {
    if (!user) return;

    try {
      // Save token to database
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          platform: platform,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  const sendLocalNotification = async (title: string, body: string, data?: any) => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: data
          }
        ]
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  // Send notification for specific events
  const sendLikeNotification = (likerName: string) => {
    sendLocalNotification(
      '💙 Someone liked you!',
      `${likerName} liked your profile. Check it out!`,
      { type: 'like', likerName }
    );
  };

  const sendMatchNotification = (matchName: string) => {
    sendLocalNotification(
      '🎉 New Match!',
      `You matched with ${matchName}! Start chatting now.`,
      { type: 'match', matchName }
    );
  };

  const sendMessageNotification = (senderName: string, message: string) => {
    const truncatedMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;
    sendLocalNotification(
      `💬 Message from ${senderName}`,
      truncatedMessage,
      { type: 'message', senderName, message }
    );
  };

  const sendLikesResetNotification = () => {
    sendLocalNotification(
      '🔄 Likes Refreshed!',
      'Your daily likes have been refreshed. Start connecting!',
      { type: 'likes_reset' }
    );
  };

  const setupNotificationListeners = () => {
    if (!isSupported) return;

    // Add listeners for push notification registration
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token:', token.value);
      savePushToken(token.value, Capacitor.getPlatform());
    });

    // Add listeners for push notification registration errors
    PushNotifications.addListener('registrationError', (err) => {
      console.error('Registration error:', err.error);
    });

    // Add listeners for push notifications received
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      
      // Handle different notification types
      const { type, likerName, matchName, senderName, message } = notification.data || {};
      
      switch (type) {
        case 'like':
          sendLikeNotification(likerName || 'Someone');
          break;
        case 'match':
          sendMatchNotification(matchName || 'Someone');
          break;
        case 'message':
          sendMessageNotification(senderName || 'Someone', message || 'New message');
          break;
        case 'likes_reset':
          sendLikesResetNotification();
          break;
      }
    });

    // Add listeners for notification taps
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed:', notification);
      
      // Handle navigation based on notification type
      const { type } = notification.notification.data || {};
      
      switch (type) {
        case 'like':
        case 'match':
          // Navigate to matches/discover page - use proper navigation instead of reload
          if (window.location.pathname !== '/dashboard') {
            window.history.pushState({}, '', '/dashboard');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
          break;
        case 'message':
          // Navigate to messages - use proper navigation instead of reload
          if (window.location.pathname !== '/dashboard' || !window.location.search.includes('tab=matches')) {
            window.history.pushState({}, '', '/dashboard?tab=matches');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
          break;
        case 'likes_reset':
          // Navigate to discover page - use proper navigation instead of reload
          if (window.location.pathname !== '/dashboard') {
            window.history.pushState({}, '', '/dashboard');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
          break;
      }
    });

    // Add listeners for local notifications
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Local notification received:', notification);
    });

    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Local notification action performed:', notification);
      
      // Handle navigation based on notification type
      const { type } = notification.notification.extra || {};
      
      switch (type) {
        case 'like':
          // Navigate to likes tab
          window.history.pushState({}, '', '/dashboard?tab=likes');
          window.dispatchEvent(new PopStateEvent('popstate'));
          break;
        case 'match':
          // Navigate to matches tab
          window.history.pushState({}, '', '/dashboard?tab=matches');
          window.dispatchEvent(new PopStateEvent('popstate'));
          break;
        case 'message':
          // Navigate to messages (matches tab)
          window.history.pushState({}, '', '/dashboard?tab=matches');
          window.dispatchEvent(new PopStateEvent('popstate'));
          break;
        case 'likes_reset':
          // Navigate to discover page
          window.history.pushState({}, '', '/dashboard');
          window.dispatchEvent(new PopStateEvent('popstate'));
          break;
      }
    });
  };

  useEffect(() => {
    if (isSupported) {
      setupNotificationListeners();
    }
  }, [isSupported]);

  // Auto-request permissions when user is authenticated
  useEffect(() => {
    if (user && isSupported && permissionStatus === 'prompt') {
      requestPermissions();
    }
  }, [user, isSupported, permissionStatus]);

  return {
    isSupported,
    permissionStatus,
    requestPermissions,
    sendLocalNotification,
    sendLikeNotification,
    sendMatchNotification,
    sendMessageNotification,
    sendLikesResetNotification
  };
};