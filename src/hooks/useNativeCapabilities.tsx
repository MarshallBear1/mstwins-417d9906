import React, { useEffect } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { useNativePushNotifications } from '@/hooks/useNativePushNotifications';
import { useCamera } from '@/hooks/useCamera';
import { useLocation } from '@/hooks/useLocation';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useShare } from '@/hooks/useShare';
import { useAppState } from '@/hooks/useAppState';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useNativeDevice } from '@/hooks/useNativeDevice';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useToast } from '@/hooks/use-toast';

// Component to integrate all native capabilities
export const NativeCapabilities: React.FC = () => {
  const haptics = useHaptics();
  const localNotifications = useLocalNotifications();
  const pushNotifications = useNativePushNotifications();
  const realtimeNotifications = useRealtimeNotifications();
  const backgroundSync = useBackgroundSync();
  const offlineStorage = useOfflineStorage();
  const performanceMonitor = usePerformanceMonitor();
  const device = useNativeDevice();
  const { toast } = useToast();

  useEffect(() => {
    if (device.isNative) {
      console.log('Native capabilities initialized:', {
        haptics: haptics.isSupported,
        localNotifications: localNotifications.isSupported,
        pushNotifications: pushNotifications.isSupported,
        realtimeNotifications: realtimeNotifications.notificationsEnabled,
        backgroundSync: backgroundSync.isOnline,
        offlineStorage: offlineStorage.isInitialized,
        deviceInfo: device.deviceInfo,
        networkStatus: device.networkStatus
      });

      // Show native capabilities status
      if (haptics.isSupported || localNotifications.isSupported || pushNotifications.isSupported) {
        haptics.successFeedback();
      }

      // Request native notification permissions
      if (localNotifications.isSupported || pushNotifications.isSupported) {
        realtimeNotifications.requestAllPermissions();
      }
    }
  }, [device.isNative]);

  // Handle network status changes
  useEffect(() => {
    if (device.isNative && device.networkStatus) {
      if (!device.isOnline) {
        toast({
          title: "You're offline",
          description: "Some features may not be available.",
          variant: "destructive",
        });
        haptics.errorFeedback();
      }
    }
  }, [device.isOnline]);

  // Handle app state changes
  useEffect(() => {
    if (device.isActive && device.isNative) {
      console.log('App became active - refreshing data');
      // You can trigger data refresh here when app becomes active
    }
  }, [device.isActive]);

  return null; // This component doesn't render anything visible
};

// Hook to provide native capabilities throughout the app
export const useNativeCapabilities = () => {
  const haptics = useHaptics();
  const localNotifications = useLocalNotifications();
  const pushNotifications = useNativePushNotifications();
  const realtimeNotifications = useRealtimeNotifications();
  const backgroundSync = useBackgroundSync();
  const offlineStorage = useOfflineStorage();
  const performanceMonitor = usePerformanceMonitor();
  const device = useNativeDevice();

  // Enhanced interaction methods with haptics
  const enhancedButtonPress = async (callback?: () => void) => {
    await haptics.buttonPress();
    callback?.();
  };

  const enhancedCardInteraction = async (callback?: () => void) => {
    await haptics.cardSwipe();
    callback?.();
  };

  const enhancedLikeAction = async (callback?: () => void) => {
    await haptics.like();
    callback?.();
  };

  const enhancedMatchAction = async (callback?: () => void) => {
    await haptics.match();
    callback?.();
  };

  const enhancedMessageAction = async (callback?: () => void) => {
    await haptics.message();
    callback?.();
  };

  const enhancedErrorAction = async (callback?: () => void) => {
    await haptics.errorFeedback();
    callback?.();
  };

  const enhancedSuccessAction = async (callback?: () => void) => {
    await haptics.successFeedback();
    callback?.();
  };

  // Notification helpers
  const notifyMatch = async (userName: string) => {
    if (device.isActive) {
      // If app is active, use local notification
      await localNotifications.scheduleMatchNotification(userName);
    }
    // Push notification will be handled by the server
  };

  const notifyLike = async (userName: string) => {
    if (device.isActive) {
      await localNotifications.scheduleLikeNotification(userName);
    }
  };

  const notifyMessage = async (senderName: string, message: string) => {
    if (device.isActive) {
      await localNotifications.scheduleMessageNotification(senderName, message);
    }
  };

  // Permission management
  const requestAllPermissions = async () => {
    const results = {
      pushNotifications: false,
      localNotifications: false
    };

    if (pushNotifications.isSupported) {
      results.pushNotifications = await pushNotifications.requestPermissions();
    }

    if (localNotifications.isSupported) {
      results.localNotifications = await localNotifications.requestPermissions();
    }

    return results;
  };

  return {
    // Device capabilities
    device,
    haptics,
    localNotifications,
    pushNotifications,
    realtimeNotifications,
    backgroundSync,
    offlineStorage,
    performanceMonitor,
    
    // Enhanced interaction methods
    enhancedButtonPress,
    enhancedCardInteraction,
    enhancedLikeAction,
    enhancedMatchAction,
    enhancedMessageAction,
    enhancedErrorAction,
    enhancedSuccessAction,
    
    // Notification helpers
    notifyMatch,
    notifyLike,
    notifyMessage,
    
    // Permission management
    requestAllPermissions,
    
    // Status checks
    isNativeApp: device.isNative,
    isOnline: device.isOnline,
    hasHaptics: haptics.isSupported,
    hasLocalNotifications: localNotifications.isEnabled,
    hasPushNotifications: pushNotifications.isEnabled,
    hasRealtimeNotifications: realtimeNotifications.notificationsEnabled,
    hasOfflineStorage: offlineStorage.isInitialized,
    platform: device.deviceInfo?.platform,
    isIOS: device.isIOS,
    isAndroid: device.isAndroid
  };
};