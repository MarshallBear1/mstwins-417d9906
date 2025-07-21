import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserPresence {
  user_id: string;
  online_at: string;
  status: 'online' | 'offline';
}

interface TypingStatus {
  user_id: string;
  match_id: string;
  typing: boolean;
  updated_at: string;
}

export const useRealtimePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    if (!user) return;

    // Set up presence channel for online/offline status
    const presenceChannel = supabase.channel('user-presence');

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const online = new Set<string>();
        
        Object.values(newState).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.status === 'online') {
              online.add(presence.user_id);
            }
          });
        });
        
        setOnlineUsers(online);
        console.log('Presence sync - online users:', Array.from(online));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        newPresences.forEach((presence: any) => {
          if (presence.status === 'online') {
            setOnlineUsers(prev => new Set(prev).add(presence.user_id));
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        leftPresences.forEach((presence: any) => {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(presence.user_id);
            return newSet;
          });
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const presenceData: UserPresence = {
            user_id: user.id,
            online_at: new Date().toISOString(),
            status: 'online'
          };

          console.log('Tracking presence for user:', user.id);
          await presenceChannel.track(presenceData);
        }
      });

    // Set up typing channel
    const typingChannel = supabase.channel('typing-indicators');

    typingChannel
      .on('broadcast', { event: 'typing' }, (payload: { payload: TypingStatus }) => {
        const { user_id, match_id, typing } = payload.payload;
        console.log('Typing event:', payload.payload);
        
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          const matchTypers = new Set(newMap.get(match_id) || []);
          
          if (typing) {
            matchTypers.add(user_id);
          } else {
            matchTypers.delete(user_id);
          }
          
          if (matchTypers.size > 0) {
            newMap.set(match_id, matchTypers);
          } else {
            newMap.delete(match_id);
          }
          
          return newMap;
        });
      })
      .subscribe();

    // Clean up presence on unmount
    return () => {
      console.log('Cleaning up presence tracking');
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [user]);

  const setTyping = async (matchId: string, isTyping: boolean) => {
    if (!user) return;

    const typingData: TypingStatus = {
      user_id: user.id,
      match_id: matchId,
      typing: isTyping,
      updated_at: new Date().toISOString()
    };

    console.log('Broadcasting typing status:', typingData);

    const typingChannel = supabase.channel('typing-indicators');
    await typingChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: typingData
    });
  };

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  const getTypingUsers = (matchId: string): string[] => {
    return Array.from(typingUsers.get(matchId) || []);
  };

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    setTyping,
    getTypingUsers
  };
};