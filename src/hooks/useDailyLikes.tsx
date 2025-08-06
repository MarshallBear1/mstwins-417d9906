import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
    if (!user) return false;
    
    try {
      console.log('🔍 Checking like permissions for user:', targetUserId);
      
      // Check for existing like first
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', user.id)
        .eq('liked_id', targetUserId)
        .single();

      if (existingLike) {
        console.log('❌ User already liked this profile');
        return false;
      }

      // Check daily limits using the RPC function
      const { data, error } = await supabase.rpc('check_and_increment_daily_likes', {
        target_user_id: targetUserId
      });
      
      if (error) {
        console.error('❌ Error checking like limit:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details
        });
        return false;
      }
      
      console.log('✅ Like permission check result:', data);
      return data === true;
    } catch (error) {
      console.error('Error in checkCanLike:', error);
      return false;
    }
  };

  return {
    remainingLikes: 999,
    loading,
    checkCanLike,
    refreshRemainingLikes: () => {},
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