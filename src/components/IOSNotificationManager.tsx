import { useEffect } from 'react';
import { useIOSNotifications } from '@/hooks/useIOSNotifications';

const IOSNotificationManager = () => {
  const {
    isSupported,
    permissionStatus,
    requestPermissions,
    sendLikeNotification,
    sendMatchNotification,
    sendMessageNotification,
    sendLikesResetNotification
  } = useIOSNotifications();

  useEffect(() => {
    // Auto-initialize notifications when supported
    if (isSupported && permissionStatus === 'prompt') {
      console.log('📱 iOS notifications supported, initializing...');
    }
  }, [isSupported, permissionStatus]);

  // This component doesn't render anything, it just manages notifications
  return null;
};

export default IOSNotificationManager;