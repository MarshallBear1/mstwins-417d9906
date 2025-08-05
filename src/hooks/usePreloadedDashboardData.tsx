import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { dashboardCache } from '@/lib/dashboardCache';

interface UsePreloadedDashboardDataProps {
  user: any;
  activeTab: string;
}

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
  last_seen?: string | null;
  additional_photos?: string[];
  selected_prompts?: {
    question: string;
    answer: string;
  }[];
  extended_profile_completed?: boolean;
}

export const usePreloadedDashboardData = ({ user, activeTab }: UsePreloadedDashboardDataProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [likes, setLikes] = useState<any[]>([]);
  const [discoverProfiles, setDiscoverProfiles] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const preloadTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(fetchTimeouts.current).forEach(clearTimeout);
      Object.values(preloadTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // Fetch profile data
  const fetchProfile = useCallback(async (useCache = true) => {
    if (!user) return;

    // Check cache first
    if (useCache) {
      const cachedProfile = dashboardCache.get<Profile>(user.id, 'profile');
      if (cachedProfile) {
        setProfile(cachedProfile);
        return cachedProfile;
      }
    }

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const profileData = data as any; // Type assertion to handle Supabase JSON types
        setProfile(profileData);
        dashboardCache.set(user.id, 'profile', profileData);
        console.log('✅ Profile fetched and cached');
        return profileData;
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  // Fetch likes data
  const fetchLikes = useCallback(async (useCache = true, background = false) => {
    if (!user) return;

    // Check cache first
    if (useCache) {
      const cachedLikes = dashboardCache.get<any[]>(user.id, 'likes');
      if (cachedLikes) {
        setLikes(cachedLikes);
        if (!background) return cachedLikes;
      }
    }

    if (!background) setLikesLoading(true);
    try {
      // First get all the user's matches to exclude them from likes
      const { data: matchesData } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      
      // Get the IDs of users we've already matched with
      const matchedUserIds = matchesData
        ? matchesData.map(match => 
            match.user1_id === user.id ? match.user2_id : match.user1_id
          )
        : [];

      const { data, error } = await supabase
        .from('likes')
        .select(`
          id,
          created_at,
          liker_id,
          liked_id
        `)
        .eq('liked_id', user.id)
        .not('liker_id', 'in', `(${matchedUserIds.length > 0 ? matchedUserIds.join(',') : 'null'})`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Fetch liker profiles separately
        const likerIds = data.map(like => like.liker_id);
        
        if (likerIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select(`
              id,
              user_id,
              first_name,
              last_name,
              avatar_url,
              location,
              ms_subtype,
              hobbies
            `)
            .in('user_id', likerIds);

          if (profilesError) throw profilesError;

          // Combine likes with profile data - flatten the structure for MatchesPage
          const likesWithProfiles = data.map(like => {
            const likerProfile = profiles?.find(profile => profile.user_id === like.liker_id);
            return {
              ...like,
              // Flatten the liker profile data to the top level for MatchesPage compatibility
              ...likerProfile,
              liker: likerProfile // Keep the nested structure for backwards compatibility if needed
            };
          });

          setLikes(likesWithProfiles);
          dashboardCache.set(user.id, 'likes', likesWithProfiles);
          console.log(`✅ Likes fetched and cached (${background ? 'background' : 'foreground'})`);
          return likesWithProfiles;
        } else {
          // No likes data
          setLikes([]);
          dashboardCache.set(user.id, 'likes', []);
          console.log(`✅ No likes found (${background ? 'background' : 'foreground'})`);
          return [];
        }
      }
    } catch (error) {
      console.error('❌ Error fetching likes:', error);
    } finally {
      if (!background) setLikesLoading(false);
    }
  }, [user]);

  // Fetch discover profiles data
  const fetchDiscoverProfiles = useCallback(async (useCache = true, background = false) => {
    if (!user) return;

    // Check cache first
    if (useCache) {
      const cachedProfiles = dashboardCache.get<any[]>(user.id, 'discover');
      if (cachedProfiles) {
        setDiscoverProfiles(cachedProfiles);
        if (!background) return cachedProfiles;
      }
    }

    if (!background) setDiscoverLoading(true);
    try {
      // This is a simplified version - you'd implement the full discover logic here
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .limit(10);

      if (error) throw error;

      if (data) {
        setDiscoverProfiles(data);
        dashboardCache.set(user.id, 'discover', data, { ttl: 2 * 60 * 1000 }); // Shorter cache for discover
        console.log(`✅ Discover profiles fetched and cached (${background ? 'background' : 'foreground'})`);
        return data;
      }
    } catch (error) {
      console.error('❌ Error fetching discover profiles:', error);
    } finally {
      if (!background) setDiscoverLoading(false);
    }
  }, [user]);

  // Fetch messages data
  const fetchMessages = useCallback(async (useCache = true, background = false) => {
    if (!user) return;

    // Check cache first
    if (useCache) {
      const cachedMessages = dashboardCache.get<any[]>(user.id, 'messages');
      if (cachedMessages) {
        setMessages(cachedMessages);
        if (!background) return cachedMessages;
      }
    }

    if (!background) setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          user1_id,
          user2_id
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // For now, just return basic match data - detailed message loading can be added later
        setMessages(data);
        dashboardCache.set(user.id, 'messages', data);
        console.log(`✅ Messages fetched and cached (${background ? 'background' : 'foreground'})`);
        return data;
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    } finally {
      if (!background) setMessagesLoading(false);
    }
  }, [user]);

  // Parallel initial fetch
  const fetchAllData = useCallback(async () => {
    if (!user) return;

    console.log('🚀 Starting parallel data fetch...');
    const startTime = Date.now();

    try {
      // Fetch all data in parallel
      const [profileData] = await Promise.allSettled([
        fetchProfile(),
        fetchLikes(true, false),
        fetchMessages(true, false),
        fetchDiscoverProfiles(true, false)
      ]);

      const endTime = Date.now();
      console.log(`⚡ Parallel fetch completed in ${endTime - startTime}ms`);

      return profileData;
    } catch (error) {
      console.error('❌ Error in parallel fetch:', error);
    }
  }, [user, fetchProfile, fetchLikes, fetchMessages, fetchDiscoverProfiles]);

  // Background preloading based on active tab
  useEffect(() => {
    if (!user || !profile) return;

    // Clear existing preload timeouts
    Object.values(preloadTimeouts.current).forEach(clearTimeout);

    const preloadDelay = 1000; // 1 second delay for background preloading

    switch (activeTab) {
      case 'discover':
        // Preload likes and messages in background
        preloadTimeouts.current.likes = setTimeout(() => {
          if (!dashboardCache.has(user.id, 'likes')) {
            fetchLikes(false, true);
          }
        }, preloadDelay);
        
        preloadTimeouts.current.messages = setTimeout(() => {
          if (!dashboardCache.has(user.id, 'messages')) {
            fetchMessages(false, true);
          }
        }, preloadDelay * 1.5);
        break;

      case 'likes':
        // Force fresh likes fetch when viewing likes tab
        preloadTimeouts.current.likes = setTimeout(() => {
          fetchLikes(false, false); // No cache, foreground fetch
        }, preloadDelay);
        
        // Preload discover and messages
        preloadTimeouts.current.discover = setTimeout(() => {
          if (!dashboardCache.has(user.id, 'discover')) {
            fetchDiscoverProfiles(false, true);
          }
        }, preloadDelay * 1.5);
        
        preloadTimeouts.current.messages = setTimeout(() => {
          if (!dashboardCache.has(user.id, 'messages')) {
            fetchMessages(false, true);
          }
        }, preloadDelay * 2);
        break;

      case 'messages':
        // Preload likes and discover
        preloadTimeouts.current.likes = setTimeout(() => {
          if (!dashboardCache.has(user.id, 'likes')) {
            fetchLikes(false, true);
          }
        }, preloadDelay);
        
        preloadTimeouts.current.discover = setTimeout(() => {
          if (!dashboardCache.has(user.id, 'discover')) {
            fetchDiscoverProfiles(false, true);
          }
        }, preloadDelay * 1.5);
        break;
    }

    return () => {
      Object.values(preloadTimeouts.current).forEach(clearTimeout);
    };
  }, [activeTab, user, profile, fetchLikes, fetchMessages, fetchDiscoverProfiles]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  // Invalidate cache when user changes and clear any stale data
  useEffect(() => {
    if (user) {
      dashboardCache.clear(); // Clear all cache to ensure fresh data
      console.log('🧹 Cache cleared for fresh data fetch');
    }
  }, [user?.id]);

  return {
    profile,
    likes,
    discoverProfiles,
    messages,
    profileLoading,
    likesLoading,
    discoverLoading,
    messagesLoading,
    fetchProfile,
    fetchLikes,
    fetchDiscoverProfiles,
    fetchMessages,
    fetchAllData,
    setProfile // Export the setter for profile updates
  };
};