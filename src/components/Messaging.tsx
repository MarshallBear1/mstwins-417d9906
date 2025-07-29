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
                  const updatedMessages = [...existingMessages, newMessage];
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
                    return [...prev, newMessage];
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
      if (match && selectedMatch?.id !== matchId) {
        console.log('🔄 Setting selected match from URL:', match.id);
        setSelectedMatch(match);
        
        // Check if we have cached messages for this match
        const cachedMessages = messageHistory.get(matchId);
        if (cachedMessages && cachedMessages.length > 0) {
          console.log('📄 Loading cached messages for match:', matchId, 'count:', cachedMessages.length);
          setMessages(cachedMessages);
        } else {
          console.log('🔄 Fetching fresh messages for match:', matchId, 'cached count:', cachedMessages?.length || 0);
          fetchMessages(matchId);
        }
      }
    } else if (!matchId && selectedMatch) {
      // Going back to match list - cache current messages
      console.log('💾 Caching messages for match:', selectedMatch.id);
      setMessageHistory(prev => new Map(prev.set(selectedMatch.id, messages)));
      setSelectedMatch(null);
      setMessages([]);
    }
  }, [matchId, matches]);

  const fetchMatches = async () => {
    if (!user) return;

    console.log('🔄 Fetching matches for user:', user.id);
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

      console.log('📋 Matches query result:', { data, error, count: data?.length });

      if (error) {
        console.error('❌ Error fetching matches:', error);
        return;
      }

      // Fetch user profiles and unread message counts for each match
      const matchesWithProfiles = await Promise.all(
        (data || []).map(async (match) => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', otherUserId)
            .single();

          // Get unread message count (removed moderation filter temporarily)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', match.id)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

          return {
            ...match,
            other_user: profileData ? {
              id: profileData.id,
              user_id: profileData.user_id,
              first_name: profileData.first_name,
              last_name: profileData.last_name,
              avatar_url: profileData.avatar_url,
              location: profileData.location,
              about_me: profileData.about_me,
              ms_subtype: profileData.ms_subtype,
              diagnosis_year: profileData.diagnosis_year,
              date_of_birth: profileData.date_of_birth,
              hobbies: profileData.hobbies || [],
              symptoms: profileData.symptoms || [],
              medications: profileData.medications || [],
              gender: profileData.gender,
              last_seen: profileData.last_seen,
              additional_photos: profileData.additional_photos || [],
              selected_prompts: Array.isArray(profileData.selected_prompts) 
                ? profileData.selected_prompts as { question: string; answer: string; }[]
                : [],
              extended_profile_completed: profileData.extended_profile_completed || false
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
            unread_count: unreadCount || 0
          };
        })
      );

      console.log('✅ Successfully fetched matches with profiles:', matchesWithProfiles.length);
      setMatches(matchesWithProfiles);
    } catch (error) {
      console.error('❌ Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (matchId: string) => {
    if (!user) return;

    console.log('🔄 Fetching messages for match:', matchId, 'user:', user.id);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      console.log('📨 Raw messages query result:', { 
        data, 
        error, 
        count: data?.length,
        matchId,
        userId: user.id,
        messageIds: data?.map(m => m.id),
        moderationStatuses: data?.map(m => m.moderation_status)
      });

      if (error) {
        console.error('❌ Error fetching messages:', error);
        return;
      }

      console.log('✅ Successfully fetched messages:', data?.length || 0);
      setMessages(data || []);
      
      // Cache the messages for this match
      setMessageHistory(prev => new Map(prev.set(matchId, data || [])));
      
      // Mark messages as read
      const { error: readError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('match_id', matchId)
        .eq('receiver_id', user.id);

      if (readError) {
        console.error('❌ Error marking messages as read:', readError);
      }

      // Update unread count for this match
      setMatches(prev => prev.map(match => 
        match.id === matchId ? { ...match, unread_count: 0 } : match
      ));
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
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

    // Filter content for potentially harmful patterns
    const { filtered, flagged } = filterContent(sanitizedContent);
    if (flagged) {
      console.warn('Message content was filtered for security:', { original: sanitizedContent, filtered });
    }

    setSending(true);
    const receiverId = selectedMatch.user1_id === user.id 
      ? selectedMatch.user2_id 
      : selectedMatch.user1_id;

    try {
      console.log('🚀 Attempting to send message:', {
        match_id: selectedMatch.id,
        sender_id: user.id,
        receiver_id: receiverId,
        content: filtered
      });

      // Moderation temporarily disabled to ensure message delivery

      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: selectedMatch.id,
          sender_id: user.id,
          receiver_id: receiverId,
          content: filtered,
          moderation_status: 'approved' // Always approve messages to ensure delivery
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
      
      // Track message sent (use original length for analytics)
      analytics.messageSent(user.id, receiverId, newMessage.trim().length);
      
      // Update unread count for this match
      setMatches(prev => prev.map(match => 
        match.id === selectedMatch.id ? { ...match, unread_count: 0 } : match
      ));

      // Email notification is now handled by the database trigger (create_message_notification_trigger)
      // which automatically queues the email when a message is inserted
      // No need to manually call the email service here
    } catch (error) {
      console.error('Error sending message:', error);
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
                onClick={() => setSelectedMatch(null)}
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
              <Dialog open={showProfileView} onOpenChange={setShowProfileView}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
                  >
                    <User className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <ProfileViewDialog 
                  profile={{
                    id: selectedMatch.other_user.id || selectedMatch.other_user.user_id || '',
                    user_id: selectedMatch.other_user.user_id || selectedMatch.other_user.id || '',
                    first_name: selectedMatch.other_user.first_name,
                    last_name: selectedMatch.other_user.last_name,
                    date_of_birth: selectedMatch.other_user.date_of_birth || null,
                    location: selectedMatch.other_user.location || '',
                    gender: selectedMatch.other_user.gender || null,
                    ms_subtype: selectedMatch.other_user.ms_subtype || null,
                    diagnosis_year: selectedMatch.other_user.diagnosis_year || null,
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
                />
              </Dialog>

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
            <div className="space-y-3">
              {messages.map((message, index) => {
                const isOwnMessage = message.sender_id === user?.id;
                const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwnMessage && showAvatar && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage 
                          src={selectedMatch.other_user.avatar_url || undefined} 
                          alt={selectedMatch.other_user.first_name}
                        />
                        <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                          {selectedMatch.other_user.first_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!isOwnMessage && !showAvatar && <div className="w-8" />}
                    
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
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
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Messages</h2>
            <p className="text-gray-600">Your conversations with matches</p>
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
              <div className="space-y-1 p-4">
                 {matches.map((match) => (
                   <div
                     key={match.id}
                     onClick={() => {
                       console.log('🔄 Match clicked:', match.id);
                       // Update URL state without full navigation
                       const newUrl = `/dashboard?tab=messages&match=${match.id}`;
                       window.history.replaceState({}, '', newUrl);
                       // Update state directly to prevent re-render loops
                       setSelectedMatch(match);
                       fetchMessages(match.id);
                     }}
                     className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 mb-3 ${
                       selectedMatch?.id === match.id ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white hover:shadow-md'
                     }`}
                   >
                     <div className="relative">
                       <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                         <AvatarImage 
                           src={match.other_user.avatar_url || undefined} 
                           alt={match.other_user.first_name}
                         />
                         <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                           {match.other_user.first_name[0]}{match.other_user.last_name[0]}
                         </AvatarFallback>
                       </Avatar>
                       {isUserOnline(match.other_user.user_id || match.other_user.id || '') && (
                         <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                       )}
                     </div>
                     
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between mb-1">
                         <div className="flex items-center gap-2">
                           <h3 className="font-semibold text-gray-900 truncate">
                             {match.other_user.first_name} {match.other_user.last_name}
                           </h3>
                           <MessageCircle className="w-4 h-4 text-blue-500" />
                         </div>
                         {match.unread_count > 0 && (
                           <Badge className="bg-blue-500 text-white rounded-full h-5 min-w-[20px] text-xs">
                             {match.unread_count}
                           </Badge>
                         )}
                       </div>
                       
                       {/* User details */}
                       <div className="flex flex-wrap gap-1 mb-2">
                         {match.other_user.date_of_birth && (
                           <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                             {(() => {
                               const birth = new Date(match.other_user.date_of_birth);
                               const today = new Date();
                               let age = today.getFullYear() - birth.getFullYear();
                               const monthDiff = today.getMonth() - birth.getMonth();
                               if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birth.getDate()) {
                                 age--;
                               }
                               return age;
                             })()}
                           </span>
                         )}
                         {match.other_user.gender && (
                           <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                             {match.other_user.gender}
                           </span>
                         )}
                         {match.other_user.ms_subtype && (
                           <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                             {match.other_user.ms_subtype}
                           </span>
                         )}
                         {match.other_user.location && (
                           <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                             {match.other_user.location}
                           </span>
                         )}
                       </div>
                       
                       <p className="text-sm text-gray-500 truncate font-medium">
                         {getLastMessage(match.id) || "Start the conversation!"}
                       </p>
                     </div>
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