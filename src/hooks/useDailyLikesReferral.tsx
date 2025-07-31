import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface DailyLikesData {
  remaining: number;
  total_limit: number;
  base_limit: number;
  has_bonus: boolean;
  can_get_bonus: boolean;
  used_likes: number;
}

export const useDailyLikesReferral = () => {
  const [likesData, setLikesData] = useState<DailyLikesData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch remaining likes data
  const fetchLikesData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔄 Fetching likes data for user:', user?.id);
      const { data, error } = await supabase.rpc('get_remaining_likes_today');
      
      if (error) {
        console.error('Error fetching likes data:', error);
        toast({
          title: "Error",
          description: "Failed to load likes information",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Likes data fetched:', data);
      setLikesData(data as unknown as DailyLikesData);
    } catch (error) {
      console.error('Exception fetching likes data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Claim referral bonus
  const claimReferralBonus = async () => {
    if (!user) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('claim_referral_bonus');
      
      if (error) {
        console.error('Error claiming referral bonus:', error);
        toast({
          title: "Error",
          description: "Failed to claim referral bonus",
          variant: "destructive"
        });
        return null;
      }

      if ((data as any).success) {
        toast({
          title: "Success! 🎉",
          description: (data as any).message,
        });
        
        // Refresh likes data
        await fetchLikesData();
        
        return {
          referralCode: (data as any).referral_code,
          referralLink: `${window.location.origin}?ref=${(data as any).referral_code}`
        };
      } else {
        toast({
          title: "Unable to Claim Bonus",
          description: (data as any).error,
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      console.error('Exception claiming referral bonus:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount and user change
  useEffect(() => {
    if (user) {
      fetchLikesData();
    }
  }, [user]);

  return {
    likesData,
    loading,
    fetchLikesData,
    claimReferralBonus,
    canGetBonus: likesData?.can_get_bonus || false,
    hasBonus: likesData?.has_bonus || false,
    remainingLikes: likesData?.remaining || 0
  };
};