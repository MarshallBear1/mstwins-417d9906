import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface StorageItem {
  key: string;
  data: any;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

export const useOfflineStorage = () => {
  const { isOnline } = useNetworkStatus();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize storage
  useEffect(() => {
    // Clean expired items on initialization
    cleanExpiredItems();
    setIsInitialized(true);
  }, []);

  // Store data with optional TTL
  const setItem = useCallback((key: string, data: any, ttl?: number) => {
    try {
      const item: StorageItem = {
        key,
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(`offline_${key}`, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Error storing offline data:', error);
      return false;
    }
  }, []);

  // Retrieve data
  const getItem = useCallback((key: string) => {
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      if (!stored) return null;

      const item: StorageItem = JSON.parse(stored);
      
      // Check if item has expired
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(`offline_${key}`);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Error retrieving offline data:', error);
      return null;
    }
  }, []);

  // Remove item
  const removeItem = useCallback((key: string) => {
    try {
      localStorage.removeItem(`offline_${key}`);
      return true;
    } catch (error) {
      console.error('Error removing offline data:', error);
      return false;
    }
  }, []);

  // Clear all offline data
  const clearAll = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('offline_')) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing offline data:', error);
      return false;
    }
  }, []);

  // Clean expired items
  const cleanExpiredItems = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach(key => {
        if (key.startsWith('offline_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const item: StorageItem = JSON.parse(stored);
            if (item.ttl && now - item.timestamp > item.ttl) {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning expired items:', error);
    }
  }, []);

  // Get storage stats
  const getStorageStats = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      const offlineKeys = keys.filter(key => key.startsWith('offline_'));
      
      let totalSize = 0;
      let itemCount = offlineKeys.length;
      let expiredCount = 0;
      const now = Date.now();

      offlineKeys.forEach(key => {
        const stored = localStorage.getItem(key);
        if (stored) {
          totalSize += stored.length;
          try {
            const item: StorageItem = JSON.parse(stored);
            if (item.ttl && now - item.timestamp > item.ttl) {
              expiredCount++;
            }
          } catch (e) {
            // Invalid item, count as expired
            expiredCount++;
          }
        }
      });

      return {
        itemCount,
        totalSize,
        expiredCount,
        estimatedSizeKB: Math.round(totalSize / 1024)
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        itemCount: 0,
        totalSize: 0,
        expiredCount: 0,
        estimatedSizeKB: 0
      };
    }
  }, []);

  // Cache profiles for offline viewing
  const cacheProfiles = useCallback((profiles: any[]) => {
    const ttl = 24 * 60 * 60 * 1000; // 24 hours
    return setItem('cached_profiles', profiles, ttl);
  }, [setItem]);

  // Get cached profiles
  const getCachedProfiles = useCallback(() => {
    return getItem('cached_profiles') || [];
  }, [getItem]);

  // Cache user's own profile
  const cacheUserProfile = useCallback((profile: any) => {
    const ttl = 12 * 60 * 60 * 1000; // 12 hours
    return setItem('user_profile', profile, ttl);
  }, [setItem]);

  // Get cached user profile
  const getCachedUserProfile = useCallback(() => {
    return getItem('user_profile');
  }, [getItem]);

  // Cache messages for offline viewing
  const cacheMessages = useCallback((conversationId: string, messages: any[]) => {
    const ttl = 7 * 24 * 60 * 60 * 1000; // 7 days
    return setItem(`messages_${conversationId}`, messages, ttl);
  }, [setItem]);

  // Get cached messages
  const getCachedMessages = useCallback((conversationId: string) => {
    return getItem(`messages_${conversationId}`) || [];
  }, [getItem]);

  // Auto-cleanup expired items every hour
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(cleanExpiredItems, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isInitialized, cleanExpiredItems]);

  return {
    setItem,
    getItem,
    removeItem,
    clearAll,
    cleanExpiredItems,
    getStorageStats,
    cacheProfiles,
    getCachedProfiles,
    cacheUserProfile,
    getCachedUserProfile,
    cacheMessages,
    getCachedMessages,
    isOnline,
    isInitialized
  };
};