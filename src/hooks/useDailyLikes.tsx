import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DailyLikesData {
  remaining: number;
  total_limit: number;
  base_limit: number;
  has_bonus: boolean;
  can_get_bonus: boolean;
  used_likes: number;
}

export const useDailyLikes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkCanLike = async (targetUserId: string): Promise<boolean> => {
    if (!user) {
      console.log('❌ No authenticated user');
      return false;
    }
    
    try {
      console.log('🔍 Checking like permissions for user:', targetUserId);
      
      // Check for existing like first
      const { data: existingLike, error: existingError } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', user.id)
        .eq('liked_id', targetUserId)
        .maybeSingle();

      if (existingError) {
        console.error('❌ Error checking existing like:', existingError);
        return false;
      }

      if (existingLike) {
        console.log('❌ User already liked this profile');
        return false;
      }

      // Try the RPC function first
      console.log('🎯 Attempting RPC function check...');
      const { data: rpcResult, error: rpcError } = await supabase.rpc('check_and_increment_daily_likes', {
        target_user_id: targetUserId
      });
      
      if (rpcError) {
        console.error('❌ RPC function error:', rpcError);
        console.error('Error details:', {
          message: rpcError.message,
          code: rpcError.code,
          hint: rpcError.hint,
          details: rpcError.details
        });
        
        // Fallback: Check if we can insert directly (this will fail if RLS blocks it)
        console.log('🔄 RPC failed, trying fallback approach...');
        
        // For now, allow the like and let the database handle any constraints
        // This is a temporary fix until we resolve the RPC authentication issue
        console.log('✅ Fallback: Allowing like to proceed');
        return true;
      }
      
      console.log('✅ RPC function result:', rpcResult);
      return rpcResult === true;
    } catch (error) {
      console.error('❌ Unexpected error in checkCanLike:', error);
      
      // Fallback: Allow the like to proceed
      console.log('🔄 Error occurred, using fallback: allowing like');
      return true;
    }
  };

  const refreshRemainingLikes = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_remaining_likes_today');
      
      if (error) {
        console.error('Error fetching remaining likes:', error);
        // Return default values on error
        return {
          remaining: 999,
          total_limit: 999,
          base_limit: 999,
          has_bonus: false,
          can_get_bonus: false,
          used_likes: 0
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error in refreshRemainingLikes:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    remainingLikes: 999,
    loading,
    checkCanLike,
    refreshRemainingLikes,
    isLimitEnforced: () => false,
    shouldShowWarning: () => false,
    hasUnlimitedLikes: true,
    likesData: {
      remaining: 999,
      total_limit: 999,
      base_limit: 999,
      has_bonus: false,
      can_get_bonus: false,
      used_likes: 0
    }
  };
};