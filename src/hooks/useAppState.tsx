import { useEffect, useState } from 'react';
import { App, AppState } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const useAppState = () => {
  const [appState, setAppState] = useState<AppState>({ isActive: true });
  const [isSupported, setIsSupported] = useState(Capacitor.isNativePlatform());

  useEffect(() => {
    if (!isSupported) return;

    // Get initial app state
    const getInitialState = async () => {
      try {
        const state = await App.getState();
        setAppState(state);
      } catch (error) {
        console.error('Error getting app state:', error);
      }
    };

    getInitialState();

    // Listen for app state changes
    const setupListeners = async () => {
      const stateChangeListener = await App.addListener('appStateChange', (state) => {
        console.log('App state changed:', state);
        setAppState(state);
      });

      // Listen for URL opens (deep links)
      const urlOpenListener = await App.addListener('appUrlOpen', (event) => {
        console.log('App opened with URL:', event.url);
        // Handle deep link navigation here
        // You can parse the URL and navigate to specific screens
      });

      // Listen for back button
      const backButtonListener = await App.addListener('backButton', (event) => {
        console.log('Back button pressed');
        // Handle back button behavior
        // You can prevent default behavior and implement custom navigation
      });

      // Cleanup listeners
      return () => {
        stateChangeListener.remove();
        urlOpenListener.remove();
        backButtonListener.remove();
      };
    };

    let cleanup: (() => void) | undefined;
    setupListeners().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [isSupported]);

  const exitApp = async () => {
    if (!isSupported) return;
    
    try {
      await App.exitApp();
    } catch (error) {
      console.error('Error exiting app:', error);
    }
  };

  const minimizeApp = async () => {
    if (!isSupported) return;
    
    try {
      await App.minimizeApp();
    } catch (error) {
      console.error('Error minimizing app:', error);
    }
  };

  const getInfo = async () => {
    if (!isSupported) return null;
    
    try {
      const info = await App.getInfo();
      return info;
    } catch (error) {
      console.error('Error getting app info:', error);
      return null;
    }
  };

  const getLaunchUrl = async () => {
    if (!isSupported) return null;
    
    try {
      const result = await App.getLaunchUrl();
      return result?.url || null;
    } catch (error) {
      console.error('Error getting launch URL:', error);
      return null;
    }
  };

  return {
    isSupported,
    appState,
    isActive: appState.isActive,
    exitApp,
    minimizeApp,
    getInfo,
    getLaunchUrl
  };
};