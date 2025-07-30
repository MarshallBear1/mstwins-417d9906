import { useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface NotificationCache {
  data: any[];
  timestamp: number;
  unreadCount: number;
}

// Singleton cache to prevent duplicate fetches across components
const notificationCacheRef: { current: NotificationCache | null } = { current: null };
const activeFetchRef: { current: Promise<any> | null } = { current: null };
const subscribersRef: { current: Set<(data: NotificationCache) => void> } = { current: new Set() };

export const useNotificationOptimization = () => {
  const { user } = useAuth();
  const callbackRef = useRef<(data: NotificationCache) => void>();

  // Subscribe to cache updates
  const subscribe = useCallback((callback: (data: NotificationCache) => void) => {
    callbackRef.current = callback;
    subscribersRef.current.add(callback);

    // Return current cache if available
    if (notificationCacheRef.current) {
      callback(notificationCacheRef.current);
    }

    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  // Optimized fetch with deduplication
  const fetchNotifications = useCallback(async (): Promise<NotificationCache> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Return existing cache if fresh (less than 30 seconds old)
    if (notificationCacheRef.current) {
      const age = Date.now() - notificationCacheRef.current.timestamp;
      if (age < 30000) { // 30 seconds
        return notificationCacheRef.current;
      }
    }

    // If there's already an active fetch, wait for it
    if (activeFetchRef.current) {
      return activeFetchRef.current;
    }

    // Start new fetch
    activeFetchRef.current = (async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const cache: NotificationCache = {
          data: data || [],
          timestamp: Date.now(),
          unreadCount: (data || []).filter(n => !n.is_read).length
        };

        // Update cache
        notificationCacheRef.current = cache;

        // Notify all subscribers
        subscribersRef.current.forEach(callback => callback(cache));

        return cache;
      } finally {
        activeFetchRef.current = null;
      }
    })();

    return activeFetchRef.current;
  }, [user]);

  // Optimized mark as read with local cache update
  const markAsReadOptimized = useCallback(async (notificationId: string) => {
    if (!user || !notificationCacheRef.current) return false;

    // Update cache immediately for instant UI response
    const currentCache = notificationCacheRef.current;
    const updatedData = currentCache.data.map(n => 
      n.id === notificationId ? { ...n, is_read: true } : n
    );
    
    const updatedCache: NotificationCache = {
      data: updatedData,
      timestamp: currentCache.timestamp,
      unreadCount: Math.max(0, currentCache.unreadCount - 1)
    };

    notificationCacheRef.current = updatedCache;
    subscribersRef.current.forEach(callback => callback(updatedCache));

    // Update database in background
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        // Revert cache on error
        notificationCacheRef.current = currentCache;
        subscribersRef.current.forEach(callback => callback(currentCache));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception marking notification as read:', error);
      // Revert cache on error
      notificationCacheRef.current = currentCache;
      subscribersRef.current.forEach(callback => callback(currentCache));
      return false;
    }
  }, [user]);

  // Optimized mark all as read
  const markAllAsReadOptimized = useCallback(async () => {
    if (!user || !notificationCacheRef.current) return false;

    const currentCache = notificationCacheRef.current;
    
    // Update cache immediately
    const updatedCache: NotificationCache = {
      data: currentCache.data.map(n => ({ ...n, is_read: true })),
      timestamp: currentCache.timestamp,
      unreadCount: 0
    };

    notificationCacheRef.current = updatedCache;
    subscribersRef.current.forEach(callback => callback(updatedCache));

    // Update database in background
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        // Revert cache on error
        notificationCacheRef.current = currentCache;
        subscribersRef.current.forEach(callback => callback(currentCache));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception marking all notifications as read:', error);
      // Revert cache on error
      notificationCacheRef.current = currentCache;
      subscribersRef.current.forEach(callback => callback(currentCache));
      return false;
    }
  }, [user]);

  // Handle new notification from real-time subscription
  const handleNewNotification = useCallback((newNotification: any) => {
    if (!notificationCacheRef.current) return;

    const updatedCache: NotificationCache = {
      data: [newNotification, ...notificationCacheRef.current.data],
      timestamp: Date.now(),
      unreadCount: notificationCacheRef.current.unreadCount + 1
    };

    notificationCacheRef.current = updatedCache;
    subscribersRef.current.forEach(callback => callback(updatedCache));
  }, []);

  // Invalidate cache (force refresh on next fetch)
  const invalidateCache = useCallback(() => {
    notificationCacheRef.current = null;
    activeFetchRef.current = null;
  }, []);

  return {
    subscribe,
    fetchNotifications,
    markAsReadOptimized,
    markAllAsReadOptimized,
    handleNewNotification,
    invalidateCache
  };
};

// Performance monitoring for notifications
export const useNotificationPerformanceMonitor = () => {
  const startTime = useRef<number>();

  const startTimer = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endTimer = useCallback((operation: string) => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      console.log(`🚀 Notification ${operation} took ${duration.toFixed(2)}ms`);
      
      if (duration > 100) {
        console.warn(`⚠️ Slow notification operation: ${operation} (${duration.toFixed(2)}ms)`);
      }
    }
  }, []);

  return { startTimer, endTimer };
};