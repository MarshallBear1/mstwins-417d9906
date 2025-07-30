import { useEffect, useState } from 'react';
import { PushNotifications, Token, ActionPerformed, PermissionStatus } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useNativePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus['receive']>('prompt');

  useEffect(() => {
    // Check if native push notifications are supported
    const nativeSupported = Capacitor.isNativePlatform();
    setIsSupported(nativeSupported);
    
    if (!nativeSupported) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    // Only initialize if user exists and we're on native platform
    if (user && nativeSupported) {
      initializePushNotifications();
    }
  }, [user]);

  const initializePushNotifications = async () => {
    if (!user || !Capacitor.isNativePlatform()) return;

    try {
      console.log('🔔 Initializing native push notifications...');
      
      // Request permissions
      const permResult = await PushNotifications.requestPermissions();
      setPermissionStatus(permResult.receive);
      
      if (permResult.receive === 'granted') {
        console.log('✅ Push notification permissions granted');
        
        // Register for notifications
        await PushNotifications.register();
        
        // Listen for registration
        PushNotifications.addListener('registration', async (token: Token) => {
          console.log('✅ Push registration success, token: ' + token.value);
          
          // Store the token in the database
          await storePushToken(token.value);
        });

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('❌ Error on registration: ' + JSON.stringify(error));
        });

        // Handle received notifications (app in foreground)
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('🔔 Push notification received: ', notification);
          
          // Show toast for foreground notifications
          toast({
            title: notification.title || 'New notification',
            description: notification.body || '',
          });
        });

        // Handle notification actions (user tapped notification)
        PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
          console.log('👆 Push notification action performed: ', notification.actionId, notification.inputValue);
          
          // Handle notification tap actions here - navigate to appropriate screen
          const notificationData = notification.notification.data;
          if (notificationData?.type) {
            // Navigate based on notification type
            switch (notificationData.type) {
              case 'like':
                window.history.pushState({}, '', '/dashboard?tab=likes');
                window.dispatchEvent(new PopStateEvent('popstate'));
                break;
              case 'match':
                window.history.pushState({}, '', '/dashboard?tab=matches');
                window.dispatchEvent(new PopStateEvent('popstate'));
                break;
              case 'message':
                window.history.pushState({}, '', '/dashboard?tab=matches');
                window.dispatchEvent(new PopStateEvent('popstate'));
                break;
              default:
                window.history.pushState({}, '', '/dashboard');
                window.dispatchEvent(new PopStateEvent('popstate'));
                break;
            }
          }
        });
      } else {
        console.log('❌ Push notification permission denied');
        toast({
          title: "Notifications Disabled",
          description: "Enable notifications in your device settings to receive updates about likes and matches.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    }
  };

  const storePushToken = async (token: string) => {
    if (!user) return;

    try {
      // Store or update the push token in the database
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          platform: Capacitor.getPlatform(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) {
        console.error('Error storing push token:', error);
      } else {
        console.log('Push token stored successfully');
      }
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  };

  const requestPermissions = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are only available on mobile devices.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await PushNotifications.requestPermissions();
      setPermissionStatus(result.receive);
      
      if (result.receive === 'granted') {
        await PushNotifications.register();
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive notifications about likes and matches!",
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
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  return {
    isSupported,
    permissionStatus,
    requestPermissions,
    isEnabled: permissionStatus === 'granted'
  };
};