import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { dashboardCache } from '@/lib/dashboardCache';
import { performLikesHealthCheck, refreshLikesData } from '@/lib/likesHealthCheck';

interface Profile {
  id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  about_me?: string;
  location: string;
  gender?: string;
  date_of_birth?: string;
  diagnosis_year?: number;
  ms_subtype?: string;
  symptoms?: string[];
  medications?: string[];
  hobbies?: string[];
  selected_prompts?: any;
  additional_photos?: string[];
  hide_from_discover?: boolean;
  extended_profile_completed?: boolean;
  moderation_status?: string;
  moderation_flag_id?: string;
  created_at?: string;
  updated_at?: string;
  last_seen?: string;
}

interface LikesError {
  message: string;
  code?: string;
  recoverable: boolean;
}

export const useEnhancedLikesData = () => {
  const { user } = useAuth();
  const [likes, setLikes] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LikesError | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Enhanced fetch with retry logic and error handling
  const fetchLikes = useCallback(async (options: {
    useCache?: boolean;
    showLoading?: boolean;
    isRetry?: boolean;
  } = {}) => {
    if (!user) return;

    const { useCache = true, showLoading = true, isRetry = false } = options;

    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      // Check cache first
      if (useCache) {
        const cached = dashboardCache.get<Profile[]>(user.id, 'likes');
        if (cached) {
          setLikes(cached);
          if (showLoading) setLoading(false);
          if (!showLoading) setRefreshing(false);
          // Still fetch fresh data in background
          setTimeout(() => fetchLikes({ useCache: false, showLoading: false }), 100);
          return;
        }
      }

      // Parallel fetch of likes and matches for efficiency
      const [likesResponse, matchesResponse] = await Promise.all([
        supabase
          .from('likes')
          .select('liker_id, created_at')
          .eq('liked_id', user.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('matches')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      ]);

      if (likesResponse.error) {
        throw new Error(`Failed to fetch likes: ${likesResponse.error.message}`);
      }
      if (matchesResponse.error) {
        throw new Error(`Failed to fetch matches: ${matchesResponse.error.message}`);
      }

      const likesData = likesResponse.data || [];
      const matchesData = matchesResponse.data || [];

      // Filter out matched users
      const matchedUserIds = new Set(
        matchesData.map(match => 
          match.user1_id === user.id ? match.user2_id : match.user1_id
        )
      );

      const unmatchedLikers = likesData.filter(
        like => !matchedUserIds.has(like.liker_id)
      );

      if (unmatchedLikers.length === 0) {
        setLikes([]);
        dashboardCache.set(user.id, 'likes', []);
        retryCountRef.current = 0; // Reset retry count on success
        return;
      }

      // Fetch profiles in batches to avoid query size limits
      const batchSize = 50;
      const profiles: Profile[] = [];
      
      for (let i = 0; i < unmatchedLikers.length; i += batchSize) {
        const batch = unmatchedLikers.slice(i, i + batchSize);
        const likerIds = batch.map(like => like.liker_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', likerIds)
          .eq('moderation_status', 'approved')
          .neq('hide_from_discover', true);

        if (profilesError) {
          throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
        }

        profiles.push(...(profilesData || []));
      }

      // Sort by original like order (most recent first)
      const sortedProfiles = profiles.sort((a, b) => {
        const aLike = unmatchedLikers.find(like => like.liker_id === a.user_id);
        const bLike = unmatchedLikers.find(like => like.liker_id === b.user_id);
        return new Date(bLike?.created_at || 0).getTime() - new Date(aLike?.created_at || 0).getTime();
      });

      setLikes(sortedProfiles);
      dashboardCache.set(user.id, 'likes', sortedProfiles);
      retryCountRef.current = 0; // Reset retry count on success

    } catch (error: any) {
      console.error('Error fetching likes:', error);
      
      const likesError: LikesError = {
        message: error.message || 'Failed to load likes',
        code: error.code,
        recoverable: retryCountRef.current < maxRetries
      };
      
      setError(likesError);

      // Auto-retry with exponential backoff
      if (!isRetry && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const retryDelay = Math.pow(2, retryCountRef.current) * 1000; // 2s, 4s, 8s
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchLikes({ ...options, isRetry: true });
        }, retryDelay);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Manual retry function
  const retry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    retryCountRef.current = 0;
    fetchLikes({ useCache: false });
  }, [fetchLikes]);

  // Pull to refresh
  const refresh = useCallback(async () => {
    if (user) {
      dashboardCache.invalidate(user.id, 'likes');
      await fetchLikes({ useCache: false, showLoading: false });
    }
  }, [user, fetchLikes]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`enhanced-likes-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'likes',
        filter: `liked_id=eq.${user.id}`
      }, () => {
        console.log('🔔 New like received - refreshing likes');
        dashboardCache.invalidate(user.id, 'likes');
        fetchLikes({ useCache: false, showLoading: false });
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'likes',
        filter: `liked_id=eq.${user.id}`
      }, () => {
        console.log('🔔 Like removed - refreshing likes');
        dashboardCache.invalidate(user.id, 'likes');
        fetchLikes({ useCache: false, showLoading: false });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches'
      }, (payload) => {
        // Only refresh if this user is involved in the match
        const match = payload.new as any;
        if (match.user1_id === user.id || match.user2_id === user.id) {
          console.log('🔔 New match created - refreshing likes');
          dashboardCache.invalidate(user.id, 'likes');
          fetchLikes({ useCache: false, showLoading: false });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [user, fetchLikes]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchLikes();
    }
  }, [user, fetchLikes]);

  // Health check function
  const runHealthCheck = useCallback(async () => {
    if (!user) return null;
    return await performLikesHealthCheck(user.id);
  }, [user]);

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    if (!user) return;
    await refreshLikesData(user.id);
    fetchLikes({ useCache: false });
  }, [user, fetchLikes]);

  return {
    likes,
    loading,
    error,
    refreshing,
    fetchLikes: () => fetchLikes({ useCache: false }),
    refresh,
    retry,
    hasError: !!error,
    canRetry: error?.recoverable || false,
    runHealthCheck,
    forceRefresh
  };
};