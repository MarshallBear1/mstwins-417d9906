import { useEffect, useState, useCallback } from 'react';
import { Device, DeviceInfo } from '@capacitor/device';
import { App, AppInfo, AppState } from '@capacitor/app';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export interface AppStateInfo {
  isActive: boolean;
  isNative: boolean;
  deviceInfo: DeviceInfo | null;
  appInfo: AppInfo | null;
  networkStatus: ConnectionStatus | null;
  batteryLevel?: number;
  isCharging?: boolean;
}

export const useNativeDevice = () => {
  const [appState, setAppState] = useState<AppStateInfo>({
    isActive: true,
    isNative: Capacitor.isNativePlatform(),
    deviceInfo: null,
    appInfo: null,
    networkStatus: null
  });

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    initializeDeviceInfo();
    setupAppStateListeners();
    setupNetworkListener();

    return () => {
      // Cleanup listeners
      App.removeAllListeners();
      Network.removeAllListeners();
    };
  }, []);

  const initializeDeviceInfo = async () => {
    try {
      const [deviceInfo, appInfo, networkStatus] = await Promise.all([
        Device.getInfo(),
        App.getInfo(),
        Network.getStatus()
      ]);

      setAppState(prev => ({
        ...prev,
        deviceInfo,
        appInfo,
        networkStatus
      }));

      setIsOnline(networkStatus.connected);

      // Get battery info if available
      if (deviceInfo.platform === 'ios' || deviceInfo.platform === 'android') {
        try {
          const batteryInfo = await Device.getBatteryInfo();
          setAppState(prev => ({
            ...prev,
            batteryLevel: batteryInfo.batteryLevel,
            isCharging: batteryInfo.isCharging
          }));
        } catch (error) {
          console.warn('Battery info not available:', error);
        }
      }
    } catch (error) {
      console.error('Error getting device info:', error);
    }
  };

  const setupAppStateListeners = () => {
    App.addListener('appStateChange', (state: AppState) => {
      console.log('App state changed:', state);
      setAppState(prev => ({ ...prev, isActive: state.isActive }));
      
      // You can add analytics tracking here
      if (state.isActive) {
        console.log('App became active');
        // Track app resumption
      } else {
        console.log('App went to background');
        // Track app backgrounding
      }
    });

    App.addListener('appUrlOpen', (event) => {
      console.log('App opened via URL:', event.url);
      // Handle deep linking here
    });

    App.addListener('appRestoredResult', (event) => {
      console.log('App restored:', event);
      // Handle app restoration from background
    });
  };

  const setupNetworkListener = () => {
    Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      console.log('Network status changed:', status);
      setIsOnline(status.connected);
      
      setAppState(prev => ({
        ...prev,
        networkStatus: status
      }));

      // You can trigger sync operations when coming back online
      if (status.connected) {
        console.log('Device is back online');
        // Trigger any pending sync operations
      } else {
        console.log('Device went offline');
        // Handle offline state
      }
    });
  };

  const getDeviceLanguage = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return null;
    
    try {
      const languageTag = await Device.getLanguageTag();
      return languageTag.value;
    } catch (error) {
      console.error('Error getting device language:', error);
      return null;
    }
  }, []);

  const openAppSettings = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return false;
    
    try {
      // For iOS, use App Store settings URL
      if (appState.deviceInfo?.platform === 'ios') {
        const url = 'app-settings:';
        window.open(url, '_system');
      } else if (appState.deviceInfo?.platform === 'android') {
        // For Android, use intent to open app settings
        const url = 'app-settings:';
        window.open(url, '_system');
      }
      return true;
    } catch (error) {
      console.error('Error opening app settings:', error);
      return false;
    }
  }, [appState.deviceInfo]);

  const minimizeApp = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return false;
    
    try {
      await App.minimizeApp();
      return true;
    } catch (error) {
      console.error('Error minimizing app:', error);
      return false;
    }
  }, []);

  const exitApp = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return false;
    
    try {
      await App.exitApp();
      return true;
    } catch (error) {
      console.error('Error exiting app:', error);
      return false;
    }
  }, []);

  // Device capability checks
  const isIOS = appState.deviceInfo?.platform === 'ios';
  const isAndroid = appState.deviceInfo?.platform === 'android';
  const isTablet = appState.deviceInfo?.platform === 'ios' && appState.deviceInfo?.model?.includes('iPad');
  const supportsHaptics = isIOS || isAndroid;
  const supportsPushNotifications = isIOS || isAndroid;
  const supportsLocalNotifications = isIOS || isAndroid;

  return {
    ...appState,
    isOnline,
    isIOS,
    isAndroid,
    isTablet,
    supportsHaptics,
    supportsPushNotifications,
    supportsLocalNotifications,
    // Methods
    getDeviceLanguage,
    openAppSettings,
    minimizeApp,
    exitApp,
    refreshDeviceInfo: initializeDeviceInfo
  };
};