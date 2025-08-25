import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from './use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface MobileEnhancementsState {
  isOffline: boolean;
  hasLowBattery: boolean;
  connectionType: string;
  isSlowConnection: boolean;
}

export const useMobileEnhancements = () => {
  const isMobile = useIsMobile();
  const [state, setState] = useState<MobileEnhancementsState>({
    isOffline: false,
    hasLowBattery: false,
    connectionType: 'unknown',
    isSlowConnection: false,
  });

  // Network status monitoring
  useEffect(() => {
    if (!isMobile) return;

    const updateOnlineStatus = () => {
      setState(prev => ({ ...prev, isOffline: !navigator.onLine }));
    };

    const updateConnection = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        setState(prev => ({
          ...prev,
          connectionType: connection.effectiveType || 'unknown',
          isSlowConnection: connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g'
        }));
      }
    };

    // Battery API monitoring
    const updateBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setState(prev => ({ 
            ...prev, 
            hasLowBattery: battery.level < 0.2 && !battery.charging 
          }));
        } catch (error) {
          console.log('Battery API not available');
        }
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    updateOnlineStatus();
    updateConnection();
    updateBattery();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [isMobile]);

  // Offline data persistence
  const cacheData = useCallback((key: string, data: any) => {
    if (!isMobile) return;
    
    try {
      localStorage.setItem(`mobile_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0'
      }));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }, [isMobile]);

  const getCachedData = useCallback((key: string, maxAge = 300000) => { // 5 minutes default
    if (!isMobile) return null;
    
    try {
      const cached = localStorage.getItem(`mobile_cache_${key}`);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem(`mobile_cache_${key}`);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  }, [isMobile]);

  // Background sync for critical data
  const backgroundSync = useCallback(async (userId: string) => {
    if (!isMobile || state.isOffline) return;

    try {
      // Sync critical data in background
      const criticalQueries = [
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('likes').select('*').eq('liked_id', userId).limit(10),
      ];

      const results = await Promise.allSettled(criticalQueries);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data) {
          const cacheKeys = ['profile', 'likes'];
          cacheData(cacheKeys[index], result.value.data);
        }
      });
    } catch (error) {
      console.warn('Background sync failed:', error);
    }
  }, [isMobile, state.isOffline, cacheData]);

  return {
    ...state,
    isMobile,
    cacheData,
    getCachedData,
    backgroundSync,
  };
};