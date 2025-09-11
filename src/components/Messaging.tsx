import { useState, useEffect, memo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, User, Trash2, Heart, MessageCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { analytics } from "@/lib/analytics";
import { sanitizeInput, checkRateLimit, sanitizeErrorMessage, filterContent } from "@/lib/security";
import ProfileViewDialog from "@/components/ProfileViewDialog";
import UnifiedProfileView from "@/components/UnifiedProfileView";

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
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
}

interface MessagingProps {
  matchId?: string;
  onBack?: () => void;
}

const Messaging = ({ matchId, onBack }: MessagingProps) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageHistory, setMessageHistory] = useState<Map<string, Message[]>>(new Map());
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showProfileView, setShowProfileView] = useState(false);
  const { isUserOnline, setTyping, getTypingUsers } = useRealtimePresence();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
            console.log('📨 New message received:', payload);
            const newMessage = payload.new as Message;
            
            // Check if this message involves the current user (either as sender or receiver)
            if (newMessage.sender_id === user.id || newMessage.receiver_id === user.id) {
              console.log('📨 Message involves current user, updating UI');
              
              // Always update the message history cache
              setMessageHistory(prev => {
                const existingMessages = prev.get(newMessage.match_id) || [];
                // Check if message already exists to prevent duplicates
                const messageExists = existingMessages.some(msg => msg.id === newMessage.id);
                if (!messageExists) {
                  const updatedMessages = [...existingMessages, newMessage].sort((a, b) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  );
                  return new Map(prev.set(newMessage.match_id, updatedMessages));
                }
                return prev;
              });
              
              // Update messages if viewing this match
              if (selectedMatch?.id === newMessage.match_id) {
                setMessages(prev => {
                  // Check if message already exists to prevent duplicates
                  const messageExists = prev.some(msg => msg.id === newMessage.id);
                  if (!messageExists) {
                    const updatedMessages = [...prev, newMessage].sort((a, b) => 
                      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                    return updatedMessages;
                  }
                  return prev;
                });
                
                // Auto-mark as read if user is receiver and viewing the conversation
                if (newMessage.receiver_id === user.id) {
                  setTimeout(() => {
                    supabase
                      .from('messages')
                      .update({ is_read: true })
                      .eq('id', newMessage.id);
                  }, 1000);
                }
              }
              
              // Refresh matches to update unread counts (only if not sender)
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
  }, [user]); // Removed selectedMatch?.id and messages from dependencies

  useEffect(() => {
    if (matchId && matches.length > 0) {
      const match = matches.find(m => m.id === matchId);
      if (match) {
        console.log('🔄 Setting selected match from URL:', match.id);
        setSelectedMatch(match);
        
        // Always fetch fresh messages to ensure we have the latest
        console.log('🔄 Fetching fresh messages for match:', matchId);
        fetchMessages(matchId);
      }
    } else if (!matchId && selectedMatch) {
      // Going back to match list - cache current messages
      console.log('💾 Caching messages for match:', selectedMatch.id);
      setMessageHistory(prev => new Map(prev.set(selectedMatch.id, messages)));
      setSelectedMatch(null);
      setMessages([]);
    }
  }, [matchId, matches.length]); // Removed selectedMatch from dependencies to prevent infinite loop

  // Load messages when a match is selected
  useEffect(() => {
    if (selectedMatch && !matchId) {
      console.log('🔄 Match selected, immediately fetching messages:', selectedMatch.id);
      // Always fetch fresh messages to ensure we have the latest data
      fetchMessages(selectedMatch.id);
    }
  }, [selectedMatch]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }, 100);
    }
  }, [messages.length]);

  const fetchMatches = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching matches:', error);
        return;
      }

      // Get user profiles for each match in batch
      const otherUserIds = (data || []).map(match => 
        match.user1_id === user.id ? match.user2_id : match.user1_id
      );

      if (otherUserIds.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', otherUserIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Get unread message counts for all matches in one query
      const { data: unreadCounts, error: unreadError } = await supabase
        .from('messages')
        .select('match_id')
        .in('match_id', (data || []).map(match => match.id))
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

      // Get last message for each match
      const { data: lastMessages, error: lastMessagesError } = await supabase
        .from('messages')
        .select('match_id, content, created_at, sender_id')
        .in('match_id', (data || []).map(match => match.id))
        .order('created_at', { ascending: false });

      if (lastMessagesError) {
        console.error('Error fetching last messages:', lastMessagesError);
      }

      // Create map of last message per match
      const lastMessageMap = (lastMessages || []).reduce((acc, msg) => {
        if (!acc[msg.match_id]) {
          acc[msg.match_id] = msg;
        }
        return acc;
      }, {} as Record<string, any>);

      // Create a lookup map for profiles
      const profileMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      // Process matches with profiles
      const matchesWithProfiles = (data || []).map(match => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const otherUserProfile = profileMap[otherUserId];

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
          unread_count: unreadCountMap[match.id] || 0,
          last_message: lastMessageMap[match.id] || null
        };
      });

      // Sort matches by most recent activity (last message time, then creation time)
      const sortedMatches = matchesWithProfiles.sort((a, b) => {
        // If both have last messages, sort by last message time
        if (a.last_message && b.last_message) {
          return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
        }
        // If only one has a last message, prioritize it
        if (a.last_message && !b.last_message) return -1;
        if (!a.last_message && b.last_message) return 1;
        // If neither has messages, sort by match creation time (most recent first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setMatches(sortedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (matchId: string) => {
    if (!user) return;

    try {
      console.log('🔄 Fetching messages for match:', matchId);
      
      // Fetch all messages regardless of moderation status
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
      
      // Debug: Log moderation status of messages
      if (data && data.length > 0) {
        console.log('📋 Message moderation status breakdown:', 
          data.reduce((acc, msg) => {
            const status = msg.moderation_status || 'null';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {})
        );
        
        // Show ALL approved messages - remove any filtering that might hide older messages
        const visibleMessages = data.filter(msg => 
          !msg.moderation_status || 
          msg.moderation_status === 'approved' || 
          msg.moderation_status === 'pending'
        );
        
        console.log(`📊 Showing ${visibleMessages.length} of ${data.length} total messages`);
        if (visibleMessages.length !== data.length) {
          console.warn(`⚠️ Some messages filtered out - check moderation status`);
          console.log('Filtered messages status:', data.filter(msg => !visibleMessages.includes(msg)).map(msg => msg.moderation_status));
        }
        
        setMessages(visibleMessages);
      } else {
        setMessages(data || []);
      }
      
      // Cache the visible messages for this match (not blocked ones)
      const messagesToCache = data && data.length > 0 ? 
        data.filter(msg => 
          !msg.moderation_status || 
          msg.moderation_status === 'approved' || 
          msg.moderation_status === 'pending'
        ) : data || [];
      setMessageHistory(prev => new Map(prev.set(matchId, messagesToCache)));
      
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
  };

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

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleTyping(e.target.value);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage();
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
      // Simple direct message sending without content filtering
      const receiverId = selectedMatch.user1_id === user.id 
        ? selectedMatch.user2_id 
        : selectedMatch.user1_id;

      console.log('🚀 Attempting to send message:', {
        match_id: selectedMatch.id,
        sender_id: user.id,
        receiver_id: receiverId,
        content: sanitizedContent
      });

      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: selectedMatch.id,
          sender_id: user.id,
          receiver_id: receiverId,
          content: sanitizedContent,
          moderation_status: 'approved' // Messages are automatically approved
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error sending message:', error);
        const sanitizedError = sanitizeErrorMessage(error);
        alert(`Error sending message: ${sanitizedError}`);
        return;
      }

      console.log('✅ Message sent successfully:', data);

      const updatedMessages = [...messages, data];
      setMessages(updatedMessages);
      
      // Update cached messages for this match
      setMessageHistory(prev => new Map(prev.set(selectedMatch.id, updatedMessages)));
      setNewMessage("");
      
      // Auto-scroll to bottom after sending message
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }, 100);
      
      // Track message sent
      analytics.messageSent(user.id, receiverId, newMessage.trim().length);
      
      // Update unread count for this match
      setMatches(prev => prev.map(match => 
        match.id === selectedMatch.id ? { ...match, unread_count: 0 } : match
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const removeMatch = async (matchId: string) => {
    if (!user) return;

    try {
      // Delete the match
      const { error: matchError } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (matchError) {
        console.error('Error removing match:', matchError);
        return;
      }

      // Delete associated messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('match_id', matchId);

      if (messagesError) {
        console.error('Error removing messages:', messagesError);
      }

      // Update local state
      setMatches(prev => prev.filter(match => match.id !== matchId));
      
      // Track match removal
      if (user) {
        analytics.matchRemoved(user.id, matchId);
      }
      
      // If this was the selected match, go back to match list
      if (selectedMatch?.id === matchId) {
        setSelectedMatch(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error removing match:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleUnmatch = async (matchId: string) => {
    if (!user) return;

    try {
      // Delete the match
      const { error: matchError } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (matchError) {
        console.error('Error removing match:', matchError);
        return;
      }

      // Delete associated messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('match_id', matchId);

      if (messagesError) {
        console.error('Error removing messages:', messagesError);
      }

      // Update local state
      setMatches(prev => prev.filter(match => match.id !== matchId));
      
      // Track match removal
      if (user) {
        analytics.matchRemoved(user.id, matchId);
      }
      
      // If this was the selected match, go back to match list
      if (selectedMatch?.id === matchId) {
        setSelectedMatch(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error removing match:', error);
    }
  };

  const getLastMessage = (matchId: string) => {
    const matchMessages = messageHistory.get(matchId) || [];
    if (matchMessages.length === 0) return null;
    return matchMessages[matchMessages.length - 1].content;
  };

  return (
    <div className="h-full bg-gray-50">
      {selectedMatch ? (
        /* Modern Chat View - Instagram DM Style */
        <div className="h-full flex flex-col bg-white">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/95 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedMatch(null);
                  setMessages([]);
                  // Clear any URL parameters to prevent reload loops
                  if (window.location.search.includes('match=')) {
                    window.history.replaceState({}, '', window.location.pathname + window.location.search.replace(/[?&]match=[^&]*/, ''));
                  }
                }}
                className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                    <AvatarImage 
                      src={selectedMatch.other_user.avatar_url || undefined} 
                      alt={selectedMatch.other_user.first_name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {selectedMatch.other_user.first_name[0]}{selectedMatch.other_user.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {isUserOnline(selectedMatch.other_user.user_id || selectedMatch.other_user.id || '') && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedMatch.other_user.first_name} {selectedMatch.other_user.last_name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isUserOnline(selectedMatch.other_user.user_id || selectedMatch.other_user.id || '') ? 
                      'Online' : 'Recently active'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
                onClick={() => setShowProfileView(true)}
              >
                <User className="w-5 h-5" />
              </Button>

              <UnifiedProfileView 
                profile={{
                  id: selectedMatch.other_user.id || selectedMatch.other_user.user_id || '',
                  user_id: selectedMatch.other_user.user_id || selectedMatch.other_user.id || '',
                  first_name: selectedMatch.other_user.first_name,
                  last_name: selectedMatch.other_user.last_name,
                  date_of_birth: selectedMatch.other_user.date_of_birth || null,
                  location: selectedMatch.other_user.location || '',
                  city: selectedMatch.other_user.location?.split(',')[0] || '',
                  gender: selectedMatch.other_user.gender || null,
                  ms_subtype: selectedMatch.other_user.ms_subtype || null,
                  symptoms: selectedMatch.other_user.symptoms || [],
                  medications: selectedMatch.other_user.medications || [],
                  hobbies: selectedMatch.other_user.hobbies || [],
                  avatar_url: selectedMatch.other_user.avatar_url,
                  about_me: selectedMatch.other_user.about_me || null,
                  last_seen: selectedMatch.other_user.last_seen || null,
                  additional_photos: selectedMatch.other_user.additional_photos || [],
                  selected_prompts: selectedMatch.other_user.selected_prompts || [],
                  extended_profile_completed: selectedMatch.other_user.extended_profile_completed || false
                }}
                open={showProfileView}
                onOpenChange={setShowProfileView}
                showActions={false}
              />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-full hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unmatch {selectedMatch.other_user.first_name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All your messages will be deleted and you'll both be removed from each other's matches.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleUnmatch(selectedMatch.id)}
                      className="bg-red-600 hover:bg-red-700 rounded-xl"
                    >
                      Unmatch
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4 px-2 py-4 bg-gray-50">
              {messages.map((message, index) => {
                const isOwnMessage = message.sender_id === user?.id;
                const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwnMessage && showAvatar && (
                      <div className="relative">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage 
                            src={selectedMatch.other_user.avatar_url || undefined} 
                            alt={selectedMatch.other_user.first_name}
                          />
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                            {selectedMatch.other_user.first_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {isUserOnline(selectedMatch.other_user.user_id || selectedMatch.other_user.id || '') && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                    )}
                    {!isOwnMessage && !showAvatar && <div className="w-8" />}
                    
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100'
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">{message.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        isOwnMessage ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">{formatTime(message.created_at)}</span>
                        {isOwnMessage && (
                          <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Typing indicator */}
              {isTyping && getTypingUsers(selectedMatch.id).length > 0 && (
                <div className="flex gap-2 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={selectedMatch.other_user.avatar_url || undefined} 
                      alt={selectedMatch.other_user.first_name}
                    />
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                      {selectedMatch.other_user.first_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Modern Message Input */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  value={newMessage}
                  onChange={handleMessageChange}
                  placeholder={`Message ${selectedMatch.other_user.first_name}...`}
                  className="min-h-[44px] max-h-32 resize-none border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition-colors px-4 py-3"
                  disabled={sending}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!newMessage.trim() || sending}
                className="h-11 w-11 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 p-0 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        /* Modern Match List - Instagram Style */
        <div className="h-full bg-white">
          {/* Messages */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            </div>
            <p className="text-gray-600 text-sm">Your conversations with matches</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches yet</h3>
              <p className="text-gray-500 text-sm max-w-sm">
                Start discovering and liking profiles to create matches and begin conversations!
              </p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-4">
                {matches.map((match, index) => (
                  <div key={match.id}>
                    <div
                      onClick={() => {
                        // Use URL navigation instead of direct state change to prevent reload
                        const currentUrl = new URL(window.location.href);
                        currentUrl.searchParams.set('match', match.id);
                        window.history.pushState({}, '', currentUrl.toString());
                        setSelectedMatch(match);
                      }}
                      className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md border border-transparent hover:border-gray-200"
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
                          <AvatarImage 
                            src={match.other_user.avatar_url || undefined} 
                            alt={match.other_user.first_name}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                            {match.other_user.first_name[0]}{match.other_user.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {isUserOnline(match.other_user.user_id || match.other_user.id || '') && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Header with name and unread count */}
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 text-base truncate">
                            {match.other_user.first_name} {match.other_user.last_name}
                          </h3>
                          {match.unread_count > 0 && (
                            <div className="bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium shadow-md">
                              {match.unread_count > 9 ? '9+' : match.unread_count}
                            </div>
                          )}
                        </div>
                        
                        {/* Profile details */}
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {match.other_user.ms_subtype && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-1.5 py-0.5 text-xs">
                              {match.other_user.ms_subtype.toUpperCase()}
                            </Badge>
                          )}
                          {match.other_user.gender && (
                            <Badge variant="outline" className="border-gray-300 text-gray-600 rounded-full px-1.5 py-0.5 text-xs">
                              {match.other_user.gender}
                            </Badge>
                          )}
                          {match.other_user.location && (
                            <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 rounded-full px-1.5 py-0.5 text-xs">
                              📍 {match.other_user.location}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Last message */}
                        <p className="text-xs text-gray-500 truncate font-medium">
                          {match.last_message 
                            ? `${match.last_message.sender_id === user?.id ? 'You: ' : ''}${match.last_message.content}`
                            : "Start the conversation!"
                          }
                        </p>
                        
                        {/* Match date */}
                        <p className="text-xs text-gray-400">
                          Matched {new Date(match.created_at).toLocaleDateString([], { 
                            month: 'short', 
                            day: 'numeric',
                            year: new Date(match.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Separator between matches */}
                    {index < matches.length - 1 && (
                      <div className="mx-4 my-2">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(Messaging);