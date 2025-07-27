import { useState, useEffect } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    connected: true,
    connectionType: 'unknown'
  });
  const [isSupported, setIsSupported] = useState(Capacitor.isNativePlatform() || 'onLine' in navigator);

  useEffect(() => {
    if (!isSupported) return;

    // Get initial network status
    const getInitialStatus = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const status = await Network.getStatus();
          setNetworkStatus({
            connected: status.connected,
            connectionType: status.connectionType
          });
        } else {
          // Use browser API
          setNetworkStatus({
            connected: navigator.onLine,
            connectionType: 'unknown'
          });
        }
      } catch (error) {
        console.error('Error getting network status:', error);
      }
    };

    getInitialStatus();

    if (Capacitor.isNativePlatform()) {
      // Listen for network status changes on native platforms
      let cleanup: (() => void) | undefined;
      
      Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
        console.log('Network status changed:', status);
        setNetworkStatus({
          connected: status.connected,
          connectionType: status.connectionType
        });
      }).then((listener) => {
        cleanup = () => listener.remove();
      });

      return () => {
        if (cleanup) cleanup();
      };
    } else {
      // Use browser API for web
      const handleOnline = () => {
        setNetworkStatus(prev => ({ ...prev, connected: true }));
      };

      const handleOffline = () => {
        setNetworkStatus(prev => ({ ...prev, connected: false }));
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [isSupported]);

  const checkNetworkStatus = async (): Promise<NetworkStatus> => {
    if (!isSupported) {
      return { connected: true, connectionType: 'unknown' };
    }

    try {
      if (Capacitor.isNativePlatform()) {
        const status = await Network.getStatus();
        const networkData = {
          connected: status.connected,
          connectionType: status.connectionType
        };
        setNetworkStatus(networkData);
        return networkData;
      } else {
        const networkData = {
          connected: navigator.onLine,
          connectionType: 'unknown'
        };
        setNetworkStatus(networkData);
        return networkData;
      }
    } catch (error) {
      console.error('Error checking network status:', error);
      return { connected: false, connectionType: 'unknown' };
    }
  };

  return {
    isSupported,
    networkStatus,
    isOnline: networkStatus.connected,
    isOffline: !networkStatus.connected,
    connectionType: networkStatus.connectionType,
    checkNetworkStatus
  };
};