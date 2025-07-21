import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { sendNotificationEmail } from '@/hooks/useAuth';

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  user1_profile?: any;
  user2_profile?: any;
}

export const useRealtimeMessaging = (matchId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    fetchMatches();
    
    if (matchId) {
      fetchMessages(matchId);
      setupMessageSubscription(matchId);
    }
  }, [user, matchId]);

  const fetchMatches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1_profile:profiles!matches_user1_id_fkey(*),
          user2_profile:profiles!matches_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMatches(data);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (matchId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
        
        // Mark messages as read
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('match_id', matchId)
          .eq('receiver_id', user.id)
          .eq('is_read', false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const setupMessageSubscription = (matchId: string) => {
    if (!user) return;

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Auto-mark as read if user is viewing this conversation
          if (newMessage.receiver_id === user.id) {
            setTimeout(() => {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMessage.id);
            }, 1000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (matchId: string, receiverId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      // Get receiver profile for email notification
      const { data: receiverProfile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', receiverId)
        .single();

      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', user.id)
        .single();

      // Get receiver email
      const { data: receiverUser } = await supabase.auth.admin.getUserById(receiverId);
      
      if (receiverUser.user?.email) {
        // Send email notification in background
        setTimeout(() => {
          sendNotificationEmail(
            receiverUser.user.email!,
            'message',
            receiverProfile?.first_name,
            senderProfile?.first_name,
            content
          ).catch(console.error);
        }, 0);
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const getOtherUser = (match: Match) => {
    if (!user) return null;
    
    if (match.user1_id === user.id) {
      return {
        id: match.user2_id,
        profile: match.user2_profile
      };
    } else {
      return {
        id: match.user1_id,
        profile: match.user1_profile
      };
    }
  };

  return {
    messages,
    matches,
    loading,
    sendMessage,
    getOtherUser,
    fetchMessages
  };
};