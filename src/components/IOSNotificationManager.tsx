import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/hooks/useAuth';
import { useIOSNotifications } from '@/hooks/useIOSNotifications';
import { useNativePushNotifications } from '@/hooks/useNativePushNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

const IOSNotificationManager = () => {
  const { user } = useAuth();
  const [isNative, setIsNative] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  
  // Only use native notifications on native platforms
  const iosNotifications = useIOSNotifications();
  const nativePushNotifications = useNativePushNotifications();
  
  // Always use realtime notifications for data management
  const realtimeNotifications = useRealtimeNotifications();

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    const ios = Capacitor.getPlatform() === 'ios';
    
    setIsNative(native);
    setIsIOS(ios);
    
    console.log('📱 Notification Manager initialized:', {
      isNative: native,
      isIOS: ios,
      user: !!user
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    if (isNative) {
      console.log('🔔 Setting up NATIVE notifications for user:', user.id);
      
      // On native platforms, ensure permissions are requested
      if (iosNotifications.isSupported && iosNotifications.permissionStatus === 'prompt') {
        console.log('📱 Requesting iOS notification permissions...');
        iosNotifications.requestPermissions();
      }
      
      if (nativePushNotifications.isSupported && nativePushNotifications.permissionStatus === 'prompt') {
        console.log('📱 Requesting push notification permissions...');
        nativePushNotifications.requestPermissions();
      }
    } else {
      console.log('🌐 Running on WEB - native notifications disabled');
    }
  }, [user, isNative, iosNotifications.permissionStatus, nativePushNotifications.permissionStatus]);

  // Session persistence validation
  useEffect(() => {
    if (user) {
      console.log('✅ Session persistence check - User logged in:', {
        userId: user.id,
        email: user.email,
        platform: Capacitor.getPlatform(),
        isNative
      });
      
      // Test session storage is working
      const testKey = `session_test_${user.id}`;
      const testValue = Date.now().toString();
      
      if (isNative) {
        // Test Capacitor storage
        import('@capacitor/preferences').then(({ Preferences }) => {
          Preferences.set({ key: testKey, value: testValue }).then(() => {
            console.log('✅ Capacitor storage test successful');
            Preferences.remove({ key: testKey });
          }).catch((error) => {
            console.error('❌ Capacitor storage test failed:', error);
          });
        });
      } else {
        // Test localStorage
        try {
          localStorage.setItem(testKey, testValue);
          const retrieved = localStorage.getItem(testKey);
          if (retrieved === testValue) {
            console.log('✅ localStorage test successful');
            localStorage.removeItem(testKey);
          } else {
            console.error('❌ localStorage test failed - value mismatch');
          }
        } catch (error) {
          console.error('❌ localStorage test failed:', error);
        }
      }
    }
  }, [user, isNative]);

  // This component doesn't render anything, it just manages notifications
  return null;
};

export default IOSNotificationManager;