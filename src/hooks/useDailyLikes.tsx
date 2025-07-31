import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useDailyLikes = () => {
  const { user } = useAuth();
  const [remainingLikes, setRemainingLikes] = useState<number>(999); // Default to unlimited
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchRemainingLikes = async () => {
      try {
        console.log('🔄 Fetching remaining likes for user:', user?.id);
        const { data, error } = await supabase.rpc('get_remaining_likes_today');
        
        if (error) {
          console.error('Error fetching remaining likes:', error);
          setRemainingLikes(999); // Default to unlimited on error
        } else {
          console.log('✅ Remaining likes fetched:', data);
          const likesInfo = data as any;
          setRemainingLikes(likesInfo?.remaining || 0);
        }
      } catch (error) {
        console.error('Error in fetchRemainingLikes:', error);
        setRemainingLikes(999);
      } finally {
        setLoading(false);
      }
    };

    fetchRemainingLikes();

    // Refresh remaining likes every minute
    const interval = setInterval(fetchRemainingLikes, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const checkCanLike = async (targetUserId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('check_and_increment_daily_likes', {
        target_user_id: targetUserId
      });
      
      if (error) {
        console.error('Error checking like limit:', error);
        return false; // Don't allow like on error to enforce limits
      }
      
      // Refresh remaining likes after successful check
      if (data === true) {
        refreshRemainingLikes();
      }
      
      return data === true;
    } catch (error) {
      console.error('Error in checkCanLike:', error);
      return false;
    }
  };

  const refreshRemainingLikes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_remaining_likes_today');
      if (!error) {
        const likesInfo = data as any;
        setRemainingLikes(likesInfo?.remaining || 0);
      }
    } catch (error) {
      console.error('Error refreshing remaining likes:', error);
    }
  };

  const isLimitEnforced = () => {
    const enforcementDate = new Date('2025-07-24');
    const today = new Date();
    return today >= enforcementDate;
  };

  const shouldShowWarning = () => {
    return isLimitEnforced() && remainingLikes === 4;
  };

  return {
    remainingLikes,
    loading,
    checkCanLike,
    refreshRemainingLikes,
    isLimitEnforced,
    shouldShowWarning,
    hasUnlimitedLikes: remainingLikes === 999
  };
};