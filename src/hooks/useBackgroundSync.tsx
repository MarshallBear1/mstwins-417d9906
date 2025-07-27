import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncQueue {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retries: number;
}

export const useBackgroundSync = () => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const syncQueueRef = useRef<SyncQueue[]>([]);
  const isProcessingRef = useRef(false);

  // Add item to sync queue
  const addToSyncQueue = useCallback((type: string, data: any) => {
    const item: SyncQueue = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    syncQueueRef.current.push(item);
    localStorage.setItem('sync_queue', JSON.stringify(syncQueueRef.current));

    // Try to sync immediately if online
    if (isOnline) {
      processSyncQueue();
    }
  }, [isOnline]);

  // Process sync queue
  const processSyncQueue = useCallback(async () => {
    if (!isOnline || !user || isProcessingRef.current) return;

    isProcessingRef.current = true;
    const queue = [...syncQueueRef.current];
    const processedItems: string[] = [];

    for (const item of queue) {
      try {
        let success = false;

        switch (item.type) {
          case 'profile_interaction':
            // Log profile interactions for analytics
            console.log('Profile interaction synced:', item.data);
            success = true;
            break;

          case 'like':
            const { error: likeError } = await supabase
              .from('likes')
              .insert({
                liker_id: item.data.liker_id,
                liked_id: item.data.liked_id,
                created_at: new Date(item.timestamp).toISOString()
              });
            success = !likeError;
            break;

          case 'pass':
            const { error: passError } = await supabase
              .from('passes')
              .insert({
                passer_id: item.data.passer_id,
                passed_id: item.data.passed_id,
                created_at: new Date(item.timestamp).toISOString()
              });
            success = !passError;
            break;

          case 'user_activity':
            const { error: activityError } = await supabase
              .rpc('update_user_last_seen', {
                user_id_param: item.data.user_id
              });
            success = !activityError;
            break;

          default:
            console.warn('Unknown sync type:', item.type);
            success = true; // Mark as processed to remove from queue
        }

        if (success) {
          processedItems.push(item.id);
        } else {
          // Increment retry count
          item.retries++;
          if (item.retries >= 3) {
            // Remove after 3 failed attempts
            processedItems.push(item.id);
            console.error('Max retries reached for sync item:', item);
          }
        }
      } catch (error) {
        console.error('Error processing sync item:', item, error);
        item.retries++;
        if (item.retries >= 3) {
          processedItems.push(item.id);
        }
      }
    }

    // Remove processed items from queue
    syncQueueRef.current = syncQueueRef.current.filter(
      item => !processedItems.includes(item.id)
    );
    localStorage.setItem('sync_queue', JSON.stringify(syncQueueRef.current));

    isProcessingRef.current = false;
  }, [isOnline, user, toast]);

  // Load sync queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('sync_queue');
    if (savedQueue) {
      try {
        syncQueueRef.current = JSON.parse(savedQueue);
      } catch (error) {
        console.error('Error loading sync queue:', error);
        localStorage.removeItem('sync_queue');
      }
    }
  }, []);

  // Process queue when coming online
  useEffect(() => {
    if (isOnline && user && syncQueueRef.current.length > 0) {
      processSyncQueue();
    }
  }, [isOnline, user, processSyncQueue]);

  // Background sync for user activity
  const syncUserActivity = useCallback(() => {
    if (user) {
      addToSyncQueue('user_activity', { user_id: user.id });
    }
  }, [user, addToSyncQueue]);

  // Auto-sync user activity every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(syncUserActivity, 30000);
    return () => clearInterval(interval);
  }, [user, syncUserActivity]);

  return {
    addToSyncQueue,
    processSyncQueue,
    syncUserActivity,
    queueLength: syncQueueRef.current.length,
    isOnline
  };
};