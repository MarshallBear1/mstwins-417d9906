import { useState, useEffect, useRef, useCallback } from "react";
import { Send, ArrowLeft, Phone, Video, MoreHorizontal, Search, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMatches = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_matches_with_last_message', { user_id_param: user.id });

      if (error) throw error;
      
      setMatches(data || []);
      
      // If matchId is provided, select that match
      if (matchId && data) {
        const match = data.find((m: Match) => m.id === matchId);
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
    if (!searchQuery) return true;
    return match.other_user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           match.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase());
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
      {selectedMatch ? (
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
            
            <Avatar className="w-10 h-10">
              <AvatarImage src={selectedMatch.other_user.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                {selectedMatch.other_user.first_name[0]}{selectedMatch.other_user.last_name[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">
                {selectedMatch.other_user.first_name} {selectedMatch.other_user.last_name[0]}.
              </h2>
              <p className="text-sm text-gray-500 truncate">
                {isUserOnline(selectedMatch.other_user.user_id) 
                  ? "Online now" 
                  : selectedMatch.other_user.last_seen 
                    ? getLastSeenText(selectedMatch.other_user.last_seen)
                    : "Last seen recently"
                }
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const showTime = index === 0 || 
                  new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 5 * 60 * 1000;

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
              {getTypingUsers(selectedMatch.id).length > 0 && (
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

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-end gap-3">
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0">
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
          <div className="bg-white border-b border-gray-200 p-4" style={{
            paddingTop: isMobile ? `max(1rem, ${safeAreaInsets.top}px)` : '1rem'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full border-gray-200 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            {filteredMatches.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No conversations yet</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  When you connect with someone, your conversations will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredMatches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => setSelectedMatch(match)}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={match.other_user.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                          {match.other_user.first_name[0]}{match.other_user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {isUserOnline(match.other_user.user_id) && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {match.other_user.first_name} {match.other_user.last_name[0]}.
                        </h3>
                        {match.last_message && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatMessageTime(match.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {match.last_message ? (
                            <>
                              {match.last_message.sender_id === user?.id && "You: "}
                              {match.last_message.content}
                            </>
                          ) : (
                            "Say hi to start the conversation!"
                          )}
                        </p>
                        {match.unread_count && match.unread_count > 0 && (
                          <Badge className="bg-blue-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center">
                            {match.unread_count > 99 ? '99+' : match.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default ModernMessaging;
