import { useState, useEffect, useCallback } from 'react';
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

interface UseOptimizedDashboardDataProps {
  user: any;
  activeTab: string;
}

export const useOptimizedDashboardData = ({ user, activeTab }: UseOptimizedDashboardDataProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [likes, setLikes] = useState<Profile[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [likesLoading, setLikesLoading] = useState(false);

  // Optimized profile fetching
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfileLoading(false);
      return;
    }

    console.log('🔄 Fetching profile optimized');
    setProfileLoading(true);

    try {
      const selectFields = 'id, user_id, first_name, last_name, date_of_birth, location, gender, ms_subtype, diagnosis_year, symptoms, medications, hobbies, avatar_url, about_me, last_seen, additional_photos, selected_prompts, extended_profile_completed';

      const { data, error } = await supabase
        .from('profiles')
        .select(selectFields)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        setProfile(null);
        return;
      }

      setProfile(data ? {
        ...data,
        selected_prompts: Array.isArray(data.selected_prompts) ? 
          data.selected_prompts as { question: string; answer: string; }[] : []
      } : null);

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

  // Ultra-optimized likes fetching with parallel queries
  const fetchLikes = useCallback(async () => {
    if (!user) return;

    console.log('🚀 Fetching likes with parallel optimization');
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
          .limit(100), // Reasonable limit
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
        setLikes([]);
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

      const loadTime = performance.now() - startTime;
      console.log(`🚀 Optimized likes loaded in ${loadTime.toFixed(2)}ms - ${formattedProfiles.length} profiles`);

    } catch (error) {
      console.error('Error in optimized fetchLikes:', error);
    } finally {
      setLikesLoading(false);
    }
  }, [user]);

  // Fetch profile on user change
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  // Fetch likes only when needed
  useEffect(() => {
    if (activeTab === 'likes' && user && profile) {
      const timeoutId = setTimeout(() => {
        fetchLikes();
      }, 50); // Small delay to batch requests

      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, user, profile, fetchLikes]);

  // Auto-refresh likes with reduced frequency
  useEffect(() => {
    if (activeTab !== 'likes' || !user) return;

    const interval = setInterval(() => {
      fetchLikes();
    }, 90000); // Refresh every 90 seconds

    return () => clearInterval(interval);
  }, [activeTab, user, fetchLikes]);

  return {
    profile,
    likes,
    profileLoading,
    likesLoading,
    fetchProfile,
    fetchLikes
  };
};