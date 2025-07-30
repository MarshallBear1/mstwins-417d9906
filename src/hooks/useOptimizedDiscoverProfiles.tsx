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
  const [error, setError] = useState<string | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const likedIdsRef = useRef<Set<string>>(new Set());
  const passedIdsRef = useRef<Set<string>>(new Set());
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Debug user authentication
  console.log('🔍 useOptimizedDiscoverProfiles - User state:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    profilesCount: profiles.length,
    loading,
    error,
    connectionStatus
  });

  // Test database connection
  const testConnection = useCallback(async () => {
    try {
      console.log('🔄 Testing database connection...');
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      console.log('✅ Database connection successful');
      setConnectionStatus('connected');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      setConnectionStatus('error');
      return false;
    }
  }, []);

  // Simplified fetch with client-side filtering and fallback strategies
  const fetchProfiles = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      console.warn('🚨 Cannot fetch profiles: No user ID available', { user, hasUser: !!user });
      setError('User authentication required');
      return;
    }

    if (loading && !isRefresh) {
      console.log('📝 Fetch already in progress, skipping...');
      return;
    }
    
    if (isRefresh) {
      console.log('🔄 Refresh requested - resetting state');
      offsetRef.current = 0;
      hasMoreRef.current = true;
      setError(null);
      retryCountRef.current = 0;
    }

    if (!hasMoreRef.current && !isRefresh) {
      console.log('📝 No more profiles available, skipping fetch');
      return;
    }

    try {
      setLoading(!isRefresh);
      setIsPreloading(isRefresh);
      setError(null);

      console.log('🔍 Starting profile fetch:', {
        userId: user?.id,
        offset: offsetRef.current,
        isRefresh,
        hasMore: hasMoreRef.current,
        retryCount: retryCountRef.current
      });

      // Test connection first if this is a retry
      if (retryCountRef.current > 0) {
        const connectionOk = await testConnection();
        if (!connectionOk && retryCountRef.current >= maxRetries) {
          throw new Error('Database connection failed after retries');
        }
      }

      // Strategy 1: Try simple fetch first (fallback for complex filtering)
      let profileData, error;
      const BATCH_SIZE = 20; // Smaller batch for better performance

      try {
        console.log('📡 Attempting simple profile fetch...');
        const result = await supabase
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
          .neq('user_id', user.id)
          .eq('moderation_status', 'approved')
          .order('last_seen', { ascending: false })
          .range(offsetRef.current, offsetRef.current + BATCH_SIZE - 1);

        profileData = result.data;
        error = result.error;

        console.log('📊 Simple fetch result:', {
          success: !error,
          profileCount: profileData?.length || 0,
          error: error?.message
        });

      } catch (fetchError) {
        console.error('❌ Simple fetch failed:', fetchError);
        throw fetchError;
      }

      if (error) {
        console.error('🚨 Database error:', error);
        throw error;
      }

      if (profileData) {
        // Client-side filtering for liked/passed profiles
        let filteredProfiles = profileData;
        
        try {
          console.log('🔍 Applying client-side filtering...');
          
          // Get liked/passed IDs for filtering (with timeout)
          const filterPromise = Promise.all([
            supabase
              .from('likes')
              .select('liked_id')
              .eq('liker_id', user.id),
            supabase
              .from('passes')
              .select('passed_id')
              .eq('passer_id', user.id)
          ]);

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Filtering timeout')), 5000)
          );

          const [likesResult, passesResult] = await Promise.race([
            filterPromise,
            timeoutPromise
          ]) as any;

          if (likesResult?.data && passesResult?.data) {
            const likedIds = new Set(likesResult.data.map((like: any) => like.liked_id));
            const passedIds = new Set(passesResult.data.map((pass: any) => pass.passed_id));
            
            filteredProfiles = profileData.filter(profile => 
              !likedIds.has(profile.user_id) && 
              !passedIds.has(profile.user_id)
            );

            console.log('✅ Client-side filtering complete:', {
              original: profileData.length,
              filtered: filteredProfiles.length,
              likedCount: likedIds.size,
              passedCount: passedIds.size
            });
          }
        } catch (filterError) {
          console.warn('⚠️ Client-side filtering failed, using unfiltered results:', filterError);
          // Continue with unfiltered results as fallback
        }

        const formattedProfiles = filteredProfiles.map(profile => ({
          ...profile,
          selected_prompts: Array.isArray(profile.selected_prompts) ? 
            profile.selected_prompts : []
        })) as Profile[];

        console.log(`📊 Processing ${formattedProfiles.length} profiles (${isRefresh ? 'refresh' : 'pagination'})`);
        
        if (isRefresh) {
          setProfiles(formattedProfiles);
        } else {
          setProfiles(prev => [...prev, ...formattedProfiles]);
        }
        
        offsetRef.current += profileData.length;
        hasMoreRef.current = profileData.length === BATCH_SIZE;
        retryCountRef.current = 0; // Reset retry count on success
        setConnectionStatus('connected');

      } else {
        console.log('📊 No profile data returned');
        hasMoreRef.current = false;
      }

    } catch (error: any) {
      console.error('🚨 Profile fetch error:', {
        error: error?.message || error,
        userId: user?.id,
        offset: offsetRef.current,
        retryCount: retryCountRef.current
      });

      const errorMessage = error?.message || 'Unknown error occurred';
      setError(errorMessage);
      setConnectionStatus('error');
      
      // Retry logic with exponential backoff
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = Math.pow(2, retryCountRef.current) * 1000; // 2s, 4s, 8s
        
        console.log(`🔄 Scheduling retry ${retryCountRef.current}/${maxRetries} in ${delay}ms`);
        
        setTimeout(() => {
          if (user?.id) { // Check user still exists
            fetchProfiles(isRefresh);
          }
        }, delay);
      } else {
        console.error('❌ Max retries reached, giving up');
        hasMoreRef.current = false;
      }
      
    } finally {
      setLoading(false);
      setIsPreloading(false);
    }
  }, [user?.id, testConnection]);

  // Simplified preload that uses same strategy as main fetch
  const preloadMore = useCallback(async () => {
    if (!user?.id || isPreloading || !hasMoreRef.current) {
      console.log('📝 Preload skipped:', { hasUser: !!user?.id, isPreloading, hasMore: hasMoreRef.current });
      return;
    }

    console.log('🔄 Preloading more profiles');
    await fetchProfiles(false); // Use main fetch logic for consistency
  }, [user?.id, isPreloading, fetchProfiles]);

  // Add loading state ref to prevent concurrent requests
  const loadingRef = useRef(false);

  // Initial load with proper guards
  useEffect(() => {
    console.log('🔍 useOptimizedDiscoverProfiles useEffect triggered:', {
      hasUser: !!user,
      userId: user?.id,
      loadingRefCurrent: loadingRef.current,
      profilesLength: profiles.length
    });
    
    if (user?.id && !loadingRef.current) {
      console.log('🚀 Starting initial profile fetch...');
      loadingRef.current = true;
      fetchProfiles(true).finally(() => {
        loadingRef.current = false;
      });
    } else if (!user?.id) {
      console.warn('🚨 No user ID available for profile fetching');
    }
  }, [user?.id, fetchProfiles]); // Include fetchProfiles to ensure it updates when strategy changes

  return {
    profiles,
    loading,
    error,
    connectionStatus,
    isPreloading,
    hasMore: hasMoreRef.current,
    refetch: () => {
      console.log('🔄 Manual refetch requested');
      if (!loadingRef.current && user?.id) {
        loadingRef.current = true;
        setError(null); // Clear error on manual refetch
        fetchProfiles(true).finally(() => {
          loadingRef.current = false;
        });
      } else {
        console.warn('🚨 Cannot refetch: loading in progress or no user ID');
      }
    },
    preloadMore,
    // Add retry function for manual error recovery
    retry: () => {
      console.log('🔄 Manual retry requested');
      retryCountRef.current = 0; // Reset retry count
      if (user?.id) {
        setError(null);
        fetchProfiles(true);
      }
    }
  };
};