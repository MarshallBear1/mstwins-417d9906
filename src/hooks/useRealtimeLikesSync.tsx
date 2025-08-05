import { useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { dashboardCache } from '@/lib/dashboardCache';

/**
 * Hook to sync likes data across the application in real-time
 * This ensures all components show consistent data when likes change
 */
export const useRealtimeLikesSync = () => {
  const { user } = useAuth();

  const invalidateAllLikesData = useCallback(() => {
    if (!user) return;
    
    // Invalidate all related cache entries
    dashboardCache.invalidate(user.id, 'likes');
    dashboardCache.invalidate(user.id, 'matches');
    dashboardCache.invalidate(user.id, 'discover'); // Discover may need refresh if user count changes
    
    // Trigger custom event for components to refresh
    window.dispatchEvent(new CustomEvent('likes-data-changed', { 
      detail: { userId: user.id } 
    }));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    console.log('🔔 Setting up real-time likes sync for user:', user.id);

    const channel = supabase
      .channel(`global-likes-sync-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'likes',
        filter: `liked_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔔 Real-time: New like received', payload);
        invalidateAllLikesData();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'likes',
        filter: `liked_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔔 Real-time: Like removed', payload);
        invalidateAllLikesData();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'likes',
        filter: `liker_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔔 Real-time: User liked someone', payload);
        invalidateAllLikesData();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches'
      }, (payload) => {
        const match = payload.new as any;
        if (match.user1_id === user.id || match.user2_id === user.id) {
          console.log('🔔 Real-time: New match created', payload);
          invalidateAllLikesData();
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'matches'
      }, (payload) => {
        const match = payload.old as any;
        if (match.user1_id === user.id || match.user2_id === user.id) {
          console.log('🔔 Real-time: Match removed', payload);
          invalidateAllLikesData();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time likes sync connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time likes sync error');
        }
      });

    return () => {
      console.log('🔔 Cleaning up real-time likes sync');
      supabase.removeChannel(channel);
    };
  }, [user, invalidateAllLikesData]);

  return {
    invalidateAllLikesData
  };
};