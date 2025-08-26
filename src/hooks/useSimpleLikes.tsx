import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useSimpleLikes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const likeProfile = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to like profiles.",
        variant: "destructive"
      });
      return false;
    }

    if (user.id === targetUserId) {
      toast({
        title: "Can't like yourself",
        description: "You can't like your own profile!",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    
    try {
      console.log('🔄 Attempting to like profile:', targetUserId);
      
      // Check for existing like first
      const { data: existingLike, error: existingError } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', user.id)
        .eq('liked_id', targetUserId)
        .maybeSingle();

      if (existingError) {
        console.error('❌ Error checking existing like:', existingError);
        toast({
          title: "Error",
          description: "Failed to check if you already liked this profile.",
          variant: "destructive"
        });
        return false;
      }

      if (existingLike) {
        toast({
          title: "Already liked",
          description: "You've already liked this profile!",
          variant: "destructive"
        });
        return false;
      }

      // Insert the like record directly
      console.log('💾 Inserting like record into database...');
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          liker_id: user.id,
          liked_id: targetUserId,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Database insert error:', insertError);
        
        // Check if it's an RLS policy error
        if (insertError.message.includes('Invalid user action') || 
            insertError.message.includes('RLS') ||
            insertError.message.includes('policy')) {
          toast({
            title: "Permission Denied",
            description: "Unable to like this profile due to security restrictions.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Like Failed",
            description: "Failed to like profile. Please try again.",
            variant: "destructive"
          });
        }
        return false;
      }
      
      console.log('✅ Like record inserted successfully');

      // Track usage in daily_likes table for analytics
      try {
        await supabase
          .from('daily_likes')
          .upsert({
            user_id: user.id,
            like_date: new Date().toISOString().split('T')[0],
            like_count: 1
          }, {
            onConflict: 'user_id,like_date'
          });
      } catch (analyticsError) {
        console.warn('⚠️ Failed to update analytics (non-critical):', analyticsError);
      }

      toast({
        title: "Profile liked! 💙",
        description: "Great choice! They'll be notified of your interest.",
      });

      return true;
    } catch (error) {
      console.error('❌ Unexpected error in likeProfile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const unlikeProfile = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('liker_id', user.id)
        .eq('liked_id', targetUserId);

      if (error) {
        console.error('❌ Error unliking profile:', error);
        return false;
      }

      toast({
        title: "Profile unliked",
        description: "You've removed your like from this profile.",
      });

      return true;
    } catch (error) {
      console.error('❌ Unexpected error in unlikeProfile:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const checkIfLiked = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', user.id)
        .eq('liked_id', targetUserId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error checking if liked:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Unexpected error in checkIfLiked:', error);
      return false;
    }
  }, [user]);

  return {
    likeProfile,
    unlikeProfile,
    checkIfLiked,
    loading,
    isAuthenticated: !!user
  };
};
