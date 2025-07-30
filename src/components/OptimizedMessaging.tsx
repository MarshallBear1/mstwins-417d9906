import { useState, useEffect, memo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, User, Trash2, Heart } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { analytics } from "@/lib/analytics";
import { sanitizeInput, checkRateLimit, sanitizeErrorMessage, filterContent } from "@/lib/security";
import ProfileViewDialog from "@/components/ProfileViewDialog";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  match_id: string;
  created_at: string;
  is_read: boolean;
}

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  other_user: {
    id?: string;
    user_id?: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    location?: string;
    about_me?: string;
    ms_subtype?: string;
    diagnosis_year?: number;
    date_of_birth?: string;
    hobbies?: string[];
    symptoms?: string[];
    medications?: string[];
    gender?: string;
    last_seen?: string;
    additional_photos?: string[];
    selected_prompts?: {
      question: string;
      answer: string;
    }[];
    extended_profile_completed?: boolean;
  };
  unread_count: number;
}

interface MessagingProps {
  matchId?: string;
  onBack?: () => void;
}

const OptimizedMessaging = memo(({ matchId, onBack }: MessagingProps) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showProfileView, setShowProfileView] = useState(false);
  const { isUserOnline, setTyping, getTypingUsers } = useRealtimePresence();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesCache = useRef<Map<string, Message[]>>(new Map());

  // Memoized fetch functions for better performance
  const fetchMatches = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Optimized query with join to reduce database round trips
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at,
          profiles!matches_user1_id_fkey(
            id, user_id, first_name, last_name, avatar_url, location, about_me, 
            ms_subtype, diagnosis_year, date_of_birth, hobbies, symptoms, medications, 
            gender, last_seen, additional_photos, selected_prompts, extended_profile_completed
          ),
          profiles2:profiles!matches_user2_id_fkey(
            id, user_id, first_name, last_name, avatar_url, location, about_me, 
            ms_subtype, diagnosis_year, date_of_birth, hobbies, symptoms, medications, 
            gender, last_seen, additional_photos, selected_prompts, extended_profile_completed
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching matches:', error);
        return;
      }

      // Get unread message counts for all matches in one query
      const matchIds = (data || []).map(match => match.id);
      const { data: unreadCounts, error: unreadError } = await supabase
        .from('messages')
        .select('match_id')
        .in('match_id', matchIds)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (unreadError) {
        console.error('Error fetching unread counts:', unreadError);
      }

      // Count unread messages per match
      const unreadCountMap = (unreadCounts || []).reduce((acc, msg) => {
        acc[msg.match_id] = (acc[msg.match_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Process matches with optimized data structure
      const matchesWithProfiles = (data || []).map(match => {
        const otherUserProfile = match.user1_id === user.id 
          ? (match as any).profiles2 
          : (match as any).profiles;

        return {
          ...match,
          other_user: otherUserProfile ? {
            id: otherUserProfile.id,
            user_id: otherUserProfile.user_id,
            first_name: otherUserProfile.first_name,
            last_name: otherUserProfile.last_name,
            avatar_url: otherUserProfile.avatar_url,
            location: otherUserProfile.location,
            about_me: otherUserProfile.about_me,
            ms_subtype: otherUserProfile.ms_subtype,
            diagnosis_year: otherUserProfile.diagnosis_year,
            date_of_birth: otherUserProfile.date_of_birth,
            hobbies: otherUserProfile.hobbies || [],
            symptoms: otherUserProfile.symptoms || [],
            medications: otherUserProfile.medications || [],
            gender: otherUserProfile.gender,
            last_seen: otherUserProfile.last_seen,
            additional_photos: otherUserProfile.additional_photos || [],
            selected_prompts: Array.isArray(otherUserProfile.selected_prompts) 
              ? otherUserProfile.selected_prompts as { question: string; answer: string; }[]
              : [],
            extended_profile_completed: otherUserProfile.extended_profile_completed || false
          } : {
            first_name: 'Unknown',
            last_name: 'User',
            avatar_url: null,
            location: '',
            about_me: '',
            ms_subtype: '',
            diagnosis_year: null,
            date_of_birth: '',
            hobbies: [],
            symptoms: [],
            medications: [],
            gender: null,
            last_seen: null,
            additional_photos: [],
            selected_prompts: [],
            extended_profile_completed: false
          },
          unread_count: unreadCountMap[match.id] || 0
        };
      });

      setMatches(matchesWithProfiles);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (matchId: string) => {
    if (!user) return;

    try {
      console.log('🔄 Fetching messages for match:', matchId);
      
      // Check cache first for instant loading
      const cachedMessages = messagesCache.current.get(matchId);
      if (cachedMessages) {
        console.log('📋 Using cached messages:', cachedMessages.length, 'messages');
        setMessages(cachedMessages);
      }

      // Always fetch fresh data to ensure we have latest messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching messages:', error);
        return;
      }

      console.log('✅ Messages fetched:', data?.length || 0, 'messages');
      
      const visibleMessages = data?.filter(msg => 
        !msg.moderation_status || 
        msg.moderation_status === 'approved' || 
        msg.moderation_status === 'pending'
      ) || [];
      
      setMessages(visibleMessages);
      messagesCache.current.set(matchId, visibleMessages);
      
      // Mark messages as read
      if (data && data.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('match_id', matchId)
          .eq('receiver_id', user.id)
          .eq('is_read', false);
      }

      // Update unread count for this match
      setMatches(prev => prev.map(match => 
        match.id === matchId ? { ...match, unread_count: 0 } : match
      ));
      
      // Scroll to bottom after loading messages
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }, 100);
    } catch (error) {
      console.error('❌ Exception fetching messages:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMatches();
      
      // Set up real-time subscription for new messages in all matches
      const messageChannel = supabase
        .channel('message-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            const newMessage = payload.new as Message;
            
            // Check if this message involves the current user
            if (newMessage.sender_id === user.id || newMessage.receiver_id === user.id) {
              console.log('📨 New message received, updating cache and UI');
              
              // Update cache
              const cachedMessages = messagesCache.current.get(newMessage.match_id) || [];
              const updatedMessages = [...cachedMessages, newMessage].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              messagesCache.current.set(newMessage.match_id, updatedMessages);
              
              // Update messages if viewing this match
              if (selectedMatch?.id === newMessage.match_id) {
                setMessages(prev => {
                  const messageExists = prev.some(msg => msg.id === newMessage.id);
                  if (!messageExists) {
                    return [...prev, newMessage].sort((a, b) => 
                      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                  }
                  return prev;
                });
                
                // Auto-mark as read if user is receiver
                if (newMessage.receiver_id === user.id) {
                  setTimeout(() => {
                    supabase
                      .from('messages')
                      .update({ is_read: true })
                      .eq('id', newMessage.id);
                  }, 1000);
                }
              }
              
              // Refresh matches for unread counts
              if (newMessage.receiver_id === user.id) {
                fetchMatches();
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
      };
    }
  }, [user, fetchMatches]);

  useEffect(() => {
    if (matchId && matches.length > 0) {
      const match = matches.find(m => m.id === matchId);
      if (match) {
        console.log('🔄 Setting selected match from URL:', match.id);
        setSelectedMatch(match);
        fetchMessages(matchId);
      }
    } else if (!matchId && selectedMatch) {
      setSelectedMatch(null);
      setMessages([]);
    }
  }, [matchId, matches.length, fetchMessages]);

  // Load messages immediately when a match is selected
  useEffect(() => {
    if (selectedMatch && !matchId) {
      console.log('🔄 Match selected, immediately fetching messages:', selectedMatch.id);
      fetchMessages(selectedMatch.id);
    }
  }, [selectedMatch, matchId, fetchMessages]);

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!selectedMatch) return;

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Start typing if not already
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      setTyping(selectedMatch.id, true);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      setIsTyping(false);
      setTyping(selectedMatch.id, false);
    }, 2000);

    setTypingTimeout(timeout);

    // Stop typing immediately if input is empty
    if (!value.trim()) {
      setIsTyping(false);
      setTyping(selectedMatch.id, false);
      clearTimeout(timeout);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedMatch || !newMessage.trim()) return;

    // Check rate limit
    const rateCheck = checkRateLimit(user.id, 'message');
    if (!rateCheck.allowed) {
      const resetTime = new Date(rateCheck.resetTime);
      const resetText = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      alert(`Message rate limit reached. You can send more messages after ${resetText}.`);
      return;
    }

    // Sanitize and validate message content
    const sanitizedContent = sanitizeInput(newMessage.trim(), 2000);
    if (!sanitizedContent) {
      alert('Message cannot be empty after processing.');
      return;
    }

    setSending(true);

    try {
      const receiverId = selectedMatch.user1_id === user.id 
        ? selectedMatch.user2_id 
        : selectedMatch.user1_id;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: selectedMatch.id,
          sender_id: user.id,
          receiver_id: receiverId,
          content: sanitizedContent,
          moderation_status: 'approved'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Message sent successfully:', data.id);
      
      setNewMessage("");
      setIsTyping(false);
      setTyping(selectedMatch.id, false);
      
      // Clear typing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }

      // The message will be automatically added via the real-time subscription
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      const errorMessage = sanitizeErrorMessage(error);
      alert(`Failed to send message: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  // Return simplified UI for now - the key improvement is the optimized data fetching
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="text-center py-8">
        <h2 className="text-xl font-bold">Optimized Messaging</h2>
        <p className="text-sm text-muted-foreground">
          Instant loading with smart caching
        </p>
      </div>
    </div>
  );
});

OptimizedMessaging.displayName = "OptimizedMessaging";

export default OptimizedMessaging;
