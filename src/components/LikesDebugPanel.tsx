import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const LikesDebugPanel = () => {
  const { user } = useAuth();
  const [debugData, setDebugData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const checkLikesData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 1. Check all likes where current user is liked
      const { data: allLikes } = await supabase
        .from('likes')
        .select('*')
        .eq('liked_id', user.id)
        .order('created_at', { ascending: false });

      // 2. Check matches
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      // 3. Get filtered likes (excluding matched users)
      const matchedUserIds = matches
        ? matches.map(match => 
            match.user1_id === user.id ? match.user2_id : match.user1_id
          )
        : [];

      const { data: filteredLikes } = await supabase
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

      // 4. Get liker profiles
      const likerIds = filteredLikes?.map(like => like.liker_id) || [];
      let profiles = [];
      
      if (likerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            first_name,
            last_name,
            avatar_url,
            location,
            ms_subtype
          `)
          .in('user_id', likerIds);
        
        profiles = profilesData || [];
      }

      setDebugData({
        allLikes: allLikes || [],
        matches: matches || [],
        matchedUserIds,
        filteredLikes: filteredLikes || [],
        profiles,
        finalLikesData: filteredLikes?.map(like => {
          const likerProfile = profiles.find((profile: any) => profile.user_id === like.liker_id);
          return {
            ...like,
            ...likerProfile,
            liker: likerProfile
          };
        }) || []
      });

    } catch (error) {
      console.error('Debug error:', error);
      setDebugData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkLikesData();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <Card className="mt-4 mx-4">
      <CardHeader>
        <CardTitle className="text-sm">Likes Debug Panel</CardTitle>
        <Button size="sm" onClick={checkLikesData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-xs">
          <div>
            <strong>All Likes (where you are liked):</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
              {JSON.stringify(debugData.allLikes || [], null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>Your Matches:</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
              {JSON.stringify(debugData.matches || [], null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>Matched User IDs (excluded from likes):</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
              {JSON.stringify(debugData.matchedUserIds || [], null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>Filtered Likes (should appear in "Who Liked You"):</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
              {JSON.stringify(debugData.filteredLikes || [], null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>Liker Profiles:</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
              {JSON.stringify(debugData.profiles || [], null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>Final Data (what MatchesPage receives):</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
              {JSON.stringify(debugData.finalLikesData || [], null, 2)}
            </pre>
          </div>
          
          {debugData.error && (
            <div className="text-red-600">
              <strong>Error:</strong> {debugData.error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};