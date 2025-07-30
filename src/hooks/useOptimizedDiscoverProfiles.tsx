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

  // Optimized fetch with server-side filtering
  const fetchProfiles = useCallback(async (isRefresh = false) => {
    if (!user) return;

    console.log('🔄 Fetching optimized discover profiles');
    setLoading(true);
    
    if (isRefresh) {
      offsetRef.current = 0;
      hasMoreRef.current = true;
      likedIdsRef.current.clear();
      passedIdsRef.current.clear();
      setProfiles([]);
    }

    try {
      // First, get user's likes and passes to filter server-side
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

      const likedIds = new Set((likesResult.data || []).map(like => like.liked_id));
      const passedIds = new Set((passesResult.data || []).map(pass => pass.passed_id));
      
      likedIdsRef.current = likedIds;
      passedIdsRef.current = passedIds;

      // Build exclusion filter
      const excludeIds = [...likedIds, ...passedIds, user.id];
      
      // Fetch profiles with server-side filtering
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

      console.log('✅ Fetched profiles:', formattedProfiles.length);

      if (isRefresh) {
        setProfiles(formattedProfiles as Profile[]);
      } else {
        setProfiles(prev => [...prev, ...formattedProfiles as Profile[]]);
      }

      offsetRef.current += 50;
      hasMoreRef.current = data?.length === 50;

    } catch (error: any) {
      console.error('❌ Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  }, [user]); // Removed 'loading' from dependencies to prevent infinite loop

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
  }, [user]); // Removed 'isPreloading' from dependencies

  // Add loading state ref to prevent concurrent requests
  const loadingRef = useRef(false);

  // Initial load with proper guards
  useEffect(() => {
    if (user && !loadingRef.current) {
      loadingRef.current = true;
      fetchProfiles(true).finally(() => {
        loadingRef.current = false;
      });
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  return {
    profiles,
    loading,
    isPreloading,
    hasMore: hasMoreRef.current,
    refetch: () => {
      if (!loadingRef.current) {
        loadingRef.current = true;
        fetchProfiles(true).finally(() => {
          loadingRef.current = false;
        });
      }
    },
    preloadMore
  };
};