import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  location: string;
  avatar_url?: string;
  ms_subtype?: string;
  extended_profile_completed?: boolean;
  selected_prompts?: { question: string; answer: string; }[];
  [key: string]: any;
}

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  other_user: any;
  unread_count: number;
  last_message?: any;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  match_id: string;
  created_at: string;
  is_read: boolean;
}

interface UsePreloadedDataProps {
  user: any;
  activeTab: string;
}

export const usePreloadedData = ({ user, activeTab }: UsePreloadedDataProps) => {
  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Likes state
  const [likes, setLikes] = useState<Profile[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);

  // Messages state  
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [messageHistory, setMessageHistory] = useState<Map<string, Message[]>>(new Map());

  // Remove profiles preloading (handled by optimized hook)

  // Cache and performance tracking
  const cacheRef = useRef({
    likes: { data: null as Profile[] | null, timestamp: 0 },
    matches: { data: null as Match[] | null, timestamp: 0 },
    messages: new Map<string, { data: Message[], timestamp: number }>()
  });

  const CACHE_DURATION = 60000; // 1 minute cache

  // Check if cached data is still valid
  const isCacheValid = (timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Optimized profile fetching
  const fetchProfile = useCallback(async () => {
    if (!user) {
      console.log('❌ No user provided to fetchProfile');
      setProfileLoading(false);
      return;
    }

    console.log('🔄 Fetching profile with preloading optimization for user:', user?.id);
    console.log('🔍 User object details:', user);
    setProfileLoading(true);

    try {
      const selectFields = 'id, user_id, first_name, last_name, date_of_birth, location, gender, ms_subtype, diagnosis_year, symptoms, medications, hobbies, avatar_url, about_me, last_seen, additional_photos, selected_prompts, extended_profile_completed';

      console.log('🔍 About to query profiles table with user_id:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(selectFields)
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('🔍 Raw Supabase response:', { data, error, userIdQueried: user.id });

      if (error) {
        console.error('❌ Error fetching profile:', error);
        setProfile(null);
        return;
      }

      console.log('📊 Profile fetch result:', { 
        hasData: !!data, 
        data,
        dataKeys: data ? Object.keys(data) : 'no data',
        firstName: data?.first_name,
        extendedProfileCompleted: data?.extended_profile_completed
      });

      if (data) {
        const profileData = {
          ...data,
          selected_prompts: Array.isArray(data.selected_prompts) ? 
            data.selected_prompts as { question: string; answer: string; }[] : []
        };
        console.log('✅ Setting profile data:', profileData);
        setProfile(profileData);
      } else {
        console.log('❌ No profile data found, setting profile to null');
        setProfile(null);
      }

      // Update last_seen in background
      if (data) {
        (async () => {
          try {
            await supabase.rpc('update_user_last_seen', { user_id_param: user.id });
          } catch (error) {
            console.error('Error updating last seen:', error);
          }
        })();
      }
    } catch (error) {
      console.error('❌ Exception in fetchProfile:', error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  // Profile preloading removed - handled by optimized hook

  // Ultra-optimized likes fetching with caching
  const fetchLikes = useCallback(async () => {
    if (!user) return;

    // Check cache first
    const cached = cacheRef.current.likes;
    if (cached.data && isCacheValid(cached.timestamp)) {
      console.log('🚀 Using cached likes data');
      setLikes(cached.data);
      return;
    }

    console.log('🚀 Fetching likes with preloading optimization');
    const startTime = performance.now();
    setLikesLoading(true);

    try {
      // Execute all queries in parallel for maximum speed
      const [likesResponse, matchesResponse] = await Promise.all([
        supabase
          .from('likes')
          .select('liker_id, created_at')
          .eq('liked_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('matches')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      ]);

      if (likesResponse.error || matchesResponse.error) {
        console.error('Error in parallel fetch:', likesResponse.error || matchesResponse.error);
        return;
      }

      const likesData = likesResponse.data || [];
      const matchesData = matchesResponse.data || [];

      // Filter out matched users efficiently
      const matchedUserIds = new Set(
        matchesData.map(match => 
          match.user1_id === user.id ? match.user2_id : match.user1_id
        )
      );

      const unmatchedLikers = likesData.filter(
        like => !matchedUserIds.has(like.liker_id)
      );

      if (unmatchedLikers.length === 0) {
        const emptyResult: Profile[] = [];
        setLikes(emptyResult);
        // Cache empty result
        cacheRef.current.likes = { data: emptyResult, timestamp: Date.now() };
        const loadTime = performance.now() - startTime;
        console.log(`🚀 No likes to display - completed in ${loadTime.toFixed(2)}ms`);
        return;
      }

      // Fetch profiles for unmatched likers
      const likerIds = unmatchedLikers.map(like => like.liker_id);
      const selectFields = 'id, user_id, first_name, last_name, date_of_birth, location, gender, ms_subtype, diagnosis_year, symptoms, medications, hobbies, avatar_url, about_me, last_seen, additional_photos, selected_prompts';

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(selectFields)
        .in('user_id', likerIds)
        .limit(50);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      const formattedProfiles = (profiles || []).map(profile => ({
        ...profile,
        selected_prompts: Array.isArray(profile.selected_prompts) ? 
          profile.selected_prompts as { question: string; answer: string; }[] : []
      }));

      setLikes(formattedProfiles);
      
      // Cache the result
      cacheRef.current.likes = { data: formattedProfiles, timestamp: Date.now() };

      const loadTime = performance.now() - startTime;
      console.log(`🚀 Optimized likes loaded in ${loadTime.toFixed(2)}ms - ${formattedProfiles.length} profiles`);

    } catch (error) {
      console.error('Error in optimized fetchLikes:', error);
    } finally {
      setLikesLoading(false);
    }
  }, [user]);

  // Preload matches and messages
  const preloadMatches = useCallback(async () => {
    if (!user) return;

    // Check cache first
    const cached = cacheRef.current.matches;
    if (cached.data && isCacheValid(cached.timestamp)) {
      console.log('🚀 Using cached matches data');
      setMatches(cached.data);
      return;
    }

    console.log('🚀 Preloading matches and messages');
    const startTime = performance.now();
    setMatchesLoading(true);

    try {
      // Get matches first
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, created_at')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        return;
      }

      if (!matchesData || matchesData.length === 0) {
        const emptyResult: Match[] = [];
        setMatches(emptyResult);
        cacheRef.current.matches = { data: emptyResult, timestamp: Date.now() };
        return;
      }

      // Get other user IDs and match IDs
      const otherUserIds = matchesData.map(match => 
        match.user1_id === user.id ? match.user2_id : match.user1_id
      );
      const matchIds = matchesData.map(m => m.id);

      // Parallel fetch of profiles, unread counts, and last messages
      const [profilesResult, unreadResult, lastMessagesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .in('user_id', otherUserIds),
        supabase
          .from('messages')
          .select('match_id')
          .in('match_id', matchIds)
          .eq('receiver_id', user.id)
          .eq('is_read', false),
        supabase
          .from('messages')
          .select('match_id, content, created_at, sender_id')
          .in('match_id', matchIds)
          .order('created_at', { ascending: false })
      ]);

      // Create lookup maps for efficiency
      const profileMap = (profilesResult.data || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      const unreadCountMap = (unreadResult.data || []).reduce((acc, msg) => {
        acc[msg.match_id] = (acc[msg.match_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const lastMessageMap = (lastMessagesResult.data || []).reduce((acc, msg) => {
        if (!acc[msg.match_id]) {
          acc[msg.match_id] = msg;
        }
        return acc;
      }, {} as Record<string, any>);

      // Process matches with all data
      const processedMatches = matchesData.map(match => ({
        ...match,
        other_user: profileMap[match.user1_id === user.id ? match.user2_id : match.user1_id] || {},
        unread_count: unreadCountMap[match.id] || 0,
        last_message: lastMessageMap[match.id] || null
      }));

      // Sort by most recent message
      processedMatches.sort((a, b) => {
        const aTime = a.last_message?.created_at || a.created_at;
        const bTime = b.last_message?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setMatches(processedMatches);
      
      // Cache the result
      cacheRef.current.matches = { data: processedMatches, timestamp: Date.now() };

      const loadTime = performance.now() - startTime;
      console.log(`🚀 Matches preloaded in ${loadTime.toFixed(2)}ms - ${processedMatches.length} matches`);

    } catch (error) {
      console.error('Error preloading matches:', error);
    } finally {
      setMatchesLoading(false);
    }
  }, [user]);

  // Preload messages for a specific match
  const preloadMessagesForMatch = useCallback(async (matchId: string) => {
    if (!user || !matchId) return;

    // Check cache first
    const cached = cacheRef.current.messages.get(matchId);
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('🚀 Using cached messages for match:', matchId);
      setMessageHistory(prev => new Map(prev.set(matchId, cached.data)));
      return;
    }

    console.log('🚀 Preloading messages for match:', matchId);

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error preloading messages:', error);
        return;
      }

      const messagesData = messages || [];
      
      // Cache the result
      cacheRef.current.messages.set(matchId, { data: messagesData, timestamp: Date.now() });
      
      // Update message history
      setMessageHistory(prev => new Map(prev.set(matchId, messagesData)));
      
      console.log(`🚀 Preloaded ${messagesData.length} messages for match ${matchId}`);

    } catch (error) {
      console.error('Error preloading messages:', error);
    }
  }, [user]);

  // Initial data loading
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  // Tab-based preloading
  useEffect(() => {
    if (!user || !profile) return;

    const preloadTimeout = setTimeout(() => {
      switch (activeTab) {
        case 'likes':
          fetchLikes();
          break;
        case 'messages':
          preloadMatches();
          break;
        case 'discover':
          // Handled by optimized discover hook
          break;
      }
    }, 50); // Small delay to batch requests

    return () => clearTimeout(preloadTimeout);
  }, [activeTab, user, profile, fetchLikes, preloadMatches]);

  // Background preloading for other tabs when user is idle
  useEffect(() => {
    if (!user || !profile) return;

    const backgroundPreloadTimeout = setTimeout(() => {
      // Preload data for tabs that aren't currently active
      if (activeTab !== 'likes') {
        fetchLikes();
      }
      if (activeTab !== 'messages') {
        preloadMatches();
      }
    }, 2000); // Preload after 2 seconds of being on a tab

    return () => clearTimeout(backgroundPreloadTimeout);
  }, [activeTab, user, profile, fetchLikes, preloadMatches]);

  return {
    // Profile data
    profile,
    profileLoading,
    fetchProfile,

    // Likes data
    likes,
    likesLoading,
    fetchLikes,

    // Messages data (simplified for performance)
    matches: [], // Will be loaded on demand
    matchesLoading: false,
    messageHistory: new Map(),
    preloadMatches: () => {},
    preloadMessagesForMatch: () => {},

    // Discover profiles removed (handled by optimized hook)

    // Utility functions
    clearCache: () => {
      cacheRef.current = {
        likes: { data: null, timestamp: 0 },
        matches: { data: null, timestamp: 0 },
        messages: new Map()
      };
    }
  };
};