import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const useIsNativeApp = () => {
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if running in Capacitor (native mobile app)
    const checkNativeApp = () => {
      const isNative = Capacitor.isNativePlatform();
      setIsNativeApp(isNative);
      setIsLoading(false);
    };

    checkNativeApp();
  }, []);

  return { isNativeApp, isLoading };
};