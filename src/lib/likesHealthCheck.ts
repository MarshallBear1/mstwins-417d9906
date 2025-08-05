import { supabase } from "@/integrations/supabase/client";

export interface LikesHealthStatus {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  totalLikes: number;
  visibleLikes: number;
}

/**
 * Performs a comprehensive health check on the likes system
 * to ensure users can see their likes properly
 */
export const performLikesHealthCheck = async (userId: string): Promise<LikesHealthStatus> => {
  const status: LikesHealthStatus = {
    isHealthy: true,
    issues: [],
    recommendations: [],
    totalLikes: 0,
    visibleLikes: 0
  };

  try {
    // Check 1: Total likes received
    const { data: allLikes, error: likesError } = await supabase
      .from('likes')
      .select('id, liker_id, created_at')
      .eq('liked_id', userId);

    if (likesError) {
      status.issues.push(`Database error: ${likesError.message}`);
      status.isHealthy = false;
      return status;
    }

    status.totalLikes = allLikes?.length || 0;

    // Check 2: Matches that might hide likes
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (matchesError) {
      status.issues.push(`Matches check failed: ${matchesError.message}`);
      status.isHealthy = false;
    }

    const matchedUserIds = new Set(
      (matches || []).map(match => 
        match.user1_id === userId ? match.user2_id : match.user1_id
      )
    );

    // Check 3: Visible likes (not matched)
    const visibleLikes = (allLikes || []).filter(
      like => !matchedUserIds.has(like.liker_id)
    );
    status.visibleLikes = visibleLikes.length;

    // Check 4: Profile data for visible likes
    if (visibleLikes.length > 0) {
      const likerIds = visibleLikes.map(like => like.liker_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, moderation_status, hide_from_discover')
        .in('user_id', likerIds);

      if (profilesError) {
        status.issues.push(`Profile data check failed: ${profilesError.message}`);
        status.isHealthy = false;
      } else {
        const validProfiles = (profiles || []).filter(
          profile => profile.moderation_status === 'approved' && !profile.hide_from_discover
        );

        if (validProfiles.length < visibleLikes.length) {
          const hiddenCount = visibleLikes.length - validProfiles.length;
          status.issues.push(`${hiddenCount} likes hidden due to moderation or privacy settings`);
          status.recommendations.push('Some users who liked you have restricted profiles');
        }
      }
    }

    // Check 5: Cache issues
    if (status.totalLikes > 0 && status.visibleLikes === 0) {
      status.issues.push('All likes are from matched users');
      status.recommendations.push('Check your matches tab to see your connections');
    }

    // Check 6: Recent activity
    const recentLikes = (allLikes || []).filter(
      like => new Date(like.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );

    if (recentLikes.length > 0 && status.visibleLikes === 0) {
      status.issues.push('Recent likes not visible - possible cache issue');
      status.recommendations.push('Try refreshing the page or pulling to refresh');
      status.isHealthy = false;
    }

    // Overall health assessment
    if (status.issues.length === 0 && status.totalLikes > 0) {
      status.recommendations.push('Likes system is working properly');
    } else if (status.totalLikes === 0) {
      status.recommendations.push('No likes received yet - keep discovering profiles!');
    }

  } catch (error: any) {
    status.issues.push(`Health check failed: ${error.message}`);
    status.isHealthy = false;
  }

  return status;
};

/**
 * Triggers a comprehensive refresh of likes data
 */
export const refreshLikesData = async (userId: string): Promise<boolean> => {
  try {
    // Clear any cached data
    const event = new CustomEvent('likes-data-changed', { 
      detail: { userId, forceRefresh: true } 
    });
    window.dispatchEvent(event);

    // Trigger a fresh fetch by clearing cache
    if (window.localStorage) {
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.includes('dashboard_cache') && key.includes(userId)
      );
      cacheKeys.forEach(key => localStorage.removeItem(key));
    }

    return true;
  } catch (error) {
    console.error('Failed to refresh likes data:', error);
    return false;
  }
};