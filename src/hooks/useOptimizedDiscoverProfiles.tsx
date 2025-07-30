import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  location: string;
  gender: string | null;
  ms_subtype: string | null;
  diagnosis_year: number | null;
  symptoms: string[];
  medications: string[];
  hobbies: string[];
  avatar_url: string | null;
  about_me: string | null;
  last_seen: string | null;
  additional_photos?: string[];
  selected_prompts?: any;
}

export const useOptimizedDiscoverProfiles = (user: any) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const likedIdsRef = useRef<Set<string>>(new Set());
  const passedIdsRef = useRef<Set<string>>(new Set());

  // Debug user authentication
  console.log('🔍 useOptimizedDiscoverProfiles - User state:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email
  });

  // Optimized fetch with server-side filtering
  const fetchProfiles = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      console.warn('🚨 Cannot fetch profiles: No user ID available', { user, hasUser: !!user });
      return;
    }

    if (loading && !isRefresh) return;
    
    if (isRefresh) {
      offsetRef.current = 0;
      hasMoreRef.current = true;
    }

    if (!hasMoreRef.current && !isRefresh) return;

    try {
      setLoading(!isRefresh);
      setIsPreloading(isRefresh);

      console.log('🔍 Fetching discover profiles:', {
        userId: user?.id,
        offset: offsetRef.current,
        isRefresh,
        hasMore: hasMoreRef.current
      });

      // First, get user's liked and passed IDs to filter server-side  
      const BATCH_SIZE = 50;
      
      const [likesResult, passesResult] = await Promise.all([
        supabase
          .from('likes')
          .select('liked_id')
          .eq('liker_id', user.id),
        supabase
          .from('passes')
          .select('passed_id')
          .eq('passer_id', user.id)
      ]);

      if (likesResult.error) {
        console.error('🚨 Error fetching likes:', likesResult.error);
        throw likesResult.error;
      }

      if (passesResult.error) {
        console.error('🚨 Error fetching passes:', passesResult.error);
        throw passesResult.error;
      }

      const likedIds = (likesResult.data || []).map(like => like.liked_id);
      const passedIds = (passesResult.data || []).map(pass => pass.passed_id);
      
      // Combine all excluded IDs including the current user
      const allExcludedIds = [...new Set([...likedIds, ...passedIds, user.id])];
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          date_of_birth,
          location,
          gender,
          ms_subtype,
          diagnosis_year,
          symptoms,
          medications,
          hobbies,
          avatar_url,
          about_me,
          last_seen,
          additional_photos,
          selected_prompts,
          extended_profile_completed
        `)
        .not('user_id', 'in', allExcludedIds)
        .neq('user_id', user.id)
        .eq('moderation_status', 'approved')
        .order('last_seen', { ascending: false })
        .range(offsetRef.current, offsetRef.current + BATCH_SIZE - 1);

      if (error) {
        console.error('🚨 Error fetching discover profiles:', error);
        throw error;
      }

      if (profileData) {
        console.log(`📊 Fetched ${profileData.length} profiles (${isRefresh ? 'refresh' : 'pagination'}):`, {
          totalProfiles: isRefresh ? profileData.length : profiles.length + profileData.length,
          hasMore: profileData.length === BATCH_SIZE,
          excludedCount: allExcludedIds.length
        });
        
        const newProfiles = profileData as Profile[];
        
        if (isRefresh) {
          setProfiles(newProfiles);
        } else {
          setProfiles(prev => [...prev, ...newProfiles]);
        }
        
        offsetRef.current += profileData.length;
        hasMoreRef.current = profileData.length === BATCH_SIZE;
      } else {
        console.log('📊 No profile data returned');
        hasMoreRef.current = false;
      }
    } catch (error) {
      console.error('🚨 Error fetching discover profiles:', {
        error: error instanceof Error ? error.message : error,
        userId: user?.id,
        offset: offsetRef.current
      });
      
      // Set hasMore to false on error to prevent infinite retry loops
      hasMoreRef.current = false;
    } finally {
      setLoading(false);
      setIsPreloading(false);
    }
  }, [user, profiles.length]);

  // Preload next batch
  const preloadMore = useCallback(async () => {
    if (!user || isPreloading || !hasMoreRef.current) return;

    console.log('🔄 Preloading more profiles');
    setIsPreloading(true);

    try {
      const excludeIds = [...likedIdsRef.current, ...passedIdsRef.current, user.id];
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          date_of_birth,
          location,
          gender,
          ms_subtype,
          diagnosis_year,
          symptoms,
          medications,
          hobbies,
          avatar_url,
          about_me,
          last_seen,
          additional_photos,
          selected_prompts
        `)
        .not('user_id', 'in', `(${excludeIds.join(',')})`)
        .eq('moderation_status', 'approved')
        .order('last_seen', { ascending: false })
        .range(offsetRef.current, offsetRef.current + 49);

      if (error) throw error;

      const formattedProfiles = (data || []).map(profile => ({
        ...profile,
        selected_prompts: Array.isArray(profile.selected_prompts) ? 
          profile.selected_prompts : []
      }));

      console.log('✅ Preloaded profiles:', formattedProfiles.length);

      setProfiles(prev => [...prev, ...formattedProfiles as Profile[]]);
      offsetRef.current += 50;
      hasMoreRef.current = data?.length === 50;

    } catch (error) {
      console.error('❌ Error preloading profiles:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [user]);

  // Add loading state ref to prevent concurrent requests
  const loadingRef = useRef(false);

  // Initial load with proper guards
  useEffect(() => {
    console.log('🔍 useOptimizedDiscoverProfiles useEffect triggered:', {
      hasUser: !!user,
      userId: user?.id,
      loadingRefCurrent: loadingRef.current
    });
    
    if (user?.id && !loadingRef.current) {
      console.log('🚀 Starting profile fetch...');
      loadingRef.current = true;
      fetchProfiles(true).finally(() => {
        loadingRef.current = false;
      });
    } else if (!user?.id) {
      console.warn('🚨 No user ID available for profile fetching');
    }
  }, [user?.id]); // Remove fetchProfiles from dependency to prevent infinite loops

  return {
    profiles,
    loading,
    isPreloading,
    hasMore: hasMoreRef.current,
    refetch: () => {
      console.log('🔄 Manual refetch requested');
      if (!loadingRef.current && user?.id) {
        loadingRef.current = true;
        fetchProfiles(true).finally(() => {
          loadingRef.current = false;
        });
      } else {
        console.warn('🚨 Cannot refetch: loading in progress or no user ID');
      }
    },
    preloadMore
  };
};