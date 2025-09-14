import { useState, useEffect, useRef, useCallback } from "react";
import { Send, ArrowLeft, User, MoreHorizontal, Search, Paperclip, Smile, MessageCircle, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";
import ExtendedProfileOverlay from "@/components/ExtendedProfileOverlay";

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
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    location?: string;
    ms_subtype?: string;
    last_seen?: string;
  };
  last_message?: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
  };
  unread_count?: number;
}

interface ModernMessagingProps {
  matchId?: string;
  onBack?: () => void;
}

const ModernMessaging = ({ matchId, onBack }: ModernMessagingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isMobile, safeAreaInsets } = useMobileOptimizations();
  const { isUserOnline, getLastSeenText, setTyping, getTypingUsers } = useRealtimePresence();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileView, setShowProfileView] = useState(false);
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'no_conversation' | 'active'>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMatches = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // 1) Load matches where current user is part of the pair
      const { data: matchRows, error: matchErr } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, created_at')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (matchErr) throw matchErr;

      const matchesRaw = matchRows || [];
      if (matchesRaw.length === 0) {
        setMatches([]);
        return;
      }

      const otherUserIds = matchesRaw.map(m => (m.user1_id === user.id ? m.user2_id : m.user1_id));
      const matchIds = matchesRaw.map(m => m.id);

      // 2) Fetch profiles for other users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url, location, ms_subtype, last_seen')
        .in('user_id', otherUserIds);
      const profilesById = new Map((profiles || []).map(p => [p.user_id, p]));

      // 3) Fetch latest messages for these matches
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, content, sender_id, receiver_id, match_id, created_at, is_read')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });

      const firstByMatch = new Map<string, any>();
      const unreadByMatch = new Map<string, number>();
      (msgs || []).forEach((m) => {
        if (!firstByMatch.has(m.match_id)) firstByMatch.set(m.match_id, m);
        if (m.receiver_id === user.id && !m.is_read) {
          unreadByMatch.set(m.match_id, (unreadByMatch.get(m.match_id) || 0) + 1);
        }
      });

      // 4) Map to typed Match[]
      const mapped: Match[] = matchesRaw.map(m => {
        const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
        const prof = profilesById.get(otherId);
        const last = firstByMatch.get(m.id);
        return {
          id: m.id,
          user1_id: m.user1_id,
          user2_id: m.user2_id,
          created_at: m.created_at,
          other_user: {
            id: prof?.user_id || otherId,
            user_id: prof?.user_id || otherId,
            first_name: prof?.first_name || 'Member',
            last_name: prof?.last_name || '',
            avatar_url: prof?.avatar_url || null,
            location: prof?.location || undefined,
            ms_subtype: prof?.ms_subtype || undefined,
            last_seen: prof?.last_seen || undefined,
          },
          last_message: last
            ? { id: last.id, content: last.content, sender_id: last.sender_id, created_at: last.created_at }
            : undefined,
          unread_count: unreadByMatch.get(m.id) || 0,
        };
      });

      setMatches(mapped);

      // If matchId is provided, select that match
      if (matchId) {
        const match = mapped.find((m) => m.id === matchId);
        if (match) {
          setSelectedMatch(match);
          loadMessages(matchId);
        }
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      toast({
        title: "Error loading conversations",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, matchId, toast]);

  const loadMessages = async (matchId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // Mark messages as read
      if (data && data.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('match_id', matchId)
          .eq('receiver_id', user.id)
          .eq('is_read', false);
      }

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedMatch || !newMessage.trim() || sending) return;

    try {
      setSending(true);
      const messageContent = newMessage.trim();
      setNewMessage("");

      const { error } = await supabase
        .from('messages')
        .insert({
          match_id: selectedMatch.id,
          sender_id: user.id,
          receiver_id: selectedMatch.other_user.user_id,
          content: messageContent
        });

      if (error) throw error;

      // Reload messages to get the new one
      loadMessages(selectedMatch.id);
      
      // Update matches list
      loadMatches();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again.",
        variant: "destructive"
      });
      setNewMessage(newMessage); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredMatches = matches.filter(match => {
    // Search filter
    const matchesSearch = !searchQuery || 
      match.other_user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    let matchesFilter = true;
    switch (messageFilter) {
      case 'unread':
        matchesFilter = (match.unread_count && match.unread_count > 0) || false;
        break;
      case 'no_conversation':
        matchesFilter = !match.last_message;
        break;
      case 'active':
        matchesFilter = match.last_message && 
          new Date(match.last_message.created_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      default:
        matchesFilter = true;
    }
    
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Real-time message subscription
  useEffect(() => {
    if (!user || !selectedMatch) return;

    const channel = supabase
      .channel(`messages:${selectedMatch.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${selectedMatch.id}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
        
        // Mark as read if it's not from current user
        if (newMessage.sender_id !== user.id) {
          supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', newMessage.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedMatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50" style={{
      paddingBottom: isMobile ? `max(0rem, ${safeAreaInsets.bottom}px)` : '0rem'
    }}>
      {selectedMatch && selectedMatch.other_user ? (
        // Chat View
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3" style={{
            paddingTop: isMobile ? `max(0.75rem, ${safeAreaInsets.top}px)` : '0.75rem'
          }}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedMatch(null)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <Avatar className="w-14 h-14 ring-2 ring-white shadow-lg">
              <AvatarImage src={selectedMatch.other_user?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-lg font-semibold">
                {selectedMatch.other_user?.first_name?.[0] || 'U'}{selectedMatch.other_user?.last_name?.[0] || 'N'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">
                {selectedMatch.other_user?.first_name || 'Unknown'} {selectedMatch.other_user?.last_name?.[0] || 'U'}.
              </h2>
              <p className="text-sm text-gray-500 truncate">
                {isUserOnline(selectedMatch.other_user?.user_id || '') 
                  ? "Online now" 
                  : selectedMatch.other_user?.last_seen 
                    ? getLastSeenText(selectedMatch.other_user.last_seen)
                    : "Last seen recently"
                }
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-gray-100 rounded-full"
                onClick={() => setShowProfileView(true)}
                title="View profile"
              >
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" style={{
            paddingBottom: isMobile ? `max(4rem, ${safeAreaInsets.bottom + 80}px)` : '1rem'
          }}>
            <div className="space-y-4">
              {messages.filter(message => message && message.id).map((message, index) => {
                if (!message || !message.id) return null;
                
                const isOwn = message.sender_id === user?.id;
                const showTime = index === 0 || 
                  new Date(message.created_at).getTime() - new Date(messages[index - 1]?.created_at || 0).getTime() > 5 * 60 * 1000;

                return (
                  <div key={message.id}>
                    {showTime && (
                      <div className="text-center mb-4">
                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                          isOwn
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'
                        }`}
                      >
                        <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          isOwn ? 'text-white/60' : 'text-gray-400'
                        }`}>
                          <span className="text-xs">
                            {new Date(message.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {isOwn && (
                            <div className="flex items-center">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {message.is_read && (
                                <svg className="w-3.5 h-3.5 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Typing indicator */}
              {selectedMatch && getTypingUsers(selectedMatch.id).length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">typing</span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input - Fixed above mobile nav */}
          <div 
            className={`bg-white border-t border-gray-200 p-4 ${
              isMobile ? 'fixed left-0 right-0' : 'relative'
            }`}
            style={{
              paddingBottom: isMobile ? `max(1rem, ${safeAreaInsets.bottom + 16}px)` : '1rem',
              bottom: isMobile ? Math.max(safeAreaInsets.bottom + 4, 100) : undefined,
              zIndex: isMobile ? 50 : undefined,
              boxShadow: isMobile ? '0 -6px 24px rgba(0,0,0,0.08)' : undefined,
              backdropFilter: isMobile ? 'saturate(180%) blur(8px)' : undefined
            }}
          >
            <div className="flex items-end gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
                onClick={() => {
                  // TODO: Implement file attachment
                  toast({
                    title: "Coming soon",
                    description: "File attachments will be available soon!",
                  });
                }}
              >
                <Paperclip className="w-5 h-5 text-gray-500" />
              </Button>
              
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Message..."
                  className="pr-12 py-3 rounded-full border-gray-200 bg-gray-50 focus:bg-white transition-colors text-[15px] min-h-[44px] resize-none"
                  disabled={sending}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full"
                  onClick={() => {
                    // TODO: Implement emoji picker
                    toast({
                      title: "Coming soon",
                      description: "Emoji picker will be available soon!",
                    });
                  }}
                >
                  <Smile className="w-5 h-5 text-gray-500" />
                </Button>
              </div>
              
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="w-11 h-11 rounded-full bg-blue-500 hover:bg-blue-600 p-0 flex-shrink-0 shadow-lg disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Conversations List
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                </div>
                <p className="text-gray-600 text-sm">Your conversations with matches</p>
              </div>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Conversations with Tabs */}
          <div className="flex-1 flex flex-col">
            <Tabs defaultValue="messages" className="flex-1 flex flex-col">
              <div className="px-4 pt-4">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger value="messages" className="text-xs">
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="new" className="text-xs">
                    Not messaged yet
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="messages" className="flex-1 mt-0">
                <ScrollArea className="flex-1 p-4">
                  {filteredMatches.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No messages yet</h3>
                      <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        Start conversations from your new matches tab
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {filteredMatches.map((match) => (
                        <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedMatch(match)}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <div className="relative flex-shrink-0">
                                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-gray-100">
                                  <AvatarImage src={match.other_user.avatar_url || undefined} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-lg sm:text-xl font-semibold">
                                    {match.other_user.first_name[0]}{match.other_user.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                {isUserOnline(match.other_user.user_id) && (
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full shadow-lg animate-pulse"></div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                    {match.other_user.first_name} {match.other_user.last_name[0]}.
                                  </h4>
                                  {match.last_message && (
                                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                      {formatMessageTime(match.last_message.created_at)}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {match.other_user.ms_subtype && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                      {match.other_user.ms_subtype}
                                    </span>
                                  )}
                                  {match.other_user.location && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                      📍 {match.other_user.location}
                                    </span>
                                  )}
                                </div>
                                
                                 <div className="flex items-center justify-between">
                                   <p className="text-sm text-gray-600 truncate flex-1 mr-2">
                                     {match.last_message ? (
                                       <>
                                         {match.last_message.sender_id === user?.id && (
                                           <span className="text-gray-500 font-medium">You: </span>
                                         )}
                                         {match.last_message.content}
                                       </>
                                     ) : (
                                       <span className="text-gray-400 italic">Start a conversation...</span>
                                     )}
                                   </p>
                                  {match.unread_count && match.unread_count > 0 && (
                                    <Badge className="bg-blue-500 text-white text-xs min-w-[22px] h-6 rounded-full flex items-center justify-center font-semibold shadow-sm">
                                      {match.unread_count > 99 ? '99+' : match.unread_count}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="new" className="flex-1 mt-0">
                <ScrollArea className="flex-1 p-4">
                  {filteredMatches.filter(m => !m.last_message).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No new matches</h3>
                      <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        Keep discovering profiles to find your matches
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {filteredMatches.filter(m => !m.last_message).map((match) => (
                        <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-green-200 bg-green-50/30" onClick={() => setSelectedMatch(match)}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <div className="relative flex-shrink-0">
                                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-green-200">
                                  <AvatarImage src={match.other_user.avatar_url || undefined} />
                                  <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white text-lg sm:text-xl font-semibold">
                                    {match.other_user.first_name[0]}{match.other_user.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                {isUserOnline(match.other_user.user_id) && (
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full shadow-lg animate-pulse"></div>
                                )}
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">!</span>
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                    {match.other_user.first_name} {match.other_user.last_name[0]}.
                                  </h4>
                                  <Badge className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                    New Match!
                                  </Badge>
                                </div>
                                
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {match.other_user.ms_subtype && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                      {match.other_user.ms_subtype}
                                    </span>
                                  )}
                                  {match.other_user.location && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                      📍 {match.other_user.location}
                                    </span>
                                  )}
                                </div>
                                
                                <p className="text-sm text-green-700 font-medium">
                                  Say hi to start the conversation! 👋
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Extended Profile Overlay (same as Discover Show More) */}
      {selectedMatch && (
        <ExtendedProfileOverlay
          profile={{
            id: selectedMatch.other_user.id,
            user_id: selectedMatch.other_user.user_id,
            first_name: selectedMatch.other_user.first_name,
            last_name: selectedMatch.other_user.last_name,
            city: selectedMatch.other_user.location?.split(',')[0] || '',
            location: selectedMatch.other_user.location,
            gender: undefined,
            ms_subtype: selectedMatch.other_user.ms_subtype,
            avatar_url: selectedMatch.other_user.avatar_url,
            hobbies: [],
            additional_photos: [],
            selected_prompts: [],
            last_seen: selectedMatch.other_user.last_seen
          } as any}
          isOpen={showProfileView}
          onClose={() => setShowProfileView(false)}
          showActions={false}
        />
      )}
    </div>
  );
};

export default ModernMessaging;
