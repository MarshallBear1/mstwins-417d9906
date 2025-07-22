import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, User, Trash2, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { analytics } from "@/lib/analytics";

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
  const { isUserOnline, setTyping, getTypingUsers } = useRealtimePresence();

  useEffect(() => {
    if (user) {
      fetchMatches();
      
      // Set up real-time subscription for new messages
      const messageChannel = supabase
        .channel('message-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          },
          (payload) => {
            console.log('📨 New message received:', payload);
            const newMessage = payload.new as Message;
            
            // Always update the message history cache
            setMessageHistory(prev => {
              const existingMessages = prev.get(newMessage.match_id) || [];
              const updatedMessages = [...existingMessages, newMessage];
              return new Map(prev.set(newMessage.match_id, updatedMessages));
            });
            
            // Update messages if viewing this match
            if (selectedMatch?.id === newMessage.match_id) {
              setMessages(prev => [...prev, newMessage]);
            }
            
            // Refresh matches to update unread counts
            fetchMatches();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${user.id}`
          },
          (payload) => {
            console.log('📤 Message sent confirmation:', payload);
            const newMessage = payload.new as Message;
            
            // Update message history for sent messages too
            setMessageHistory(prev => {
              const existingMessages = prev.get(newMessage.match_id) || [];
              const updatedMessages = [...existingMessages, newMessage];
              return new Map(prev.set(newMessage.match_id, updatedMessages));
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
      };
    }
  }, [user, selectedMatch?.id, messages]);

  useEffect(() => {
    if (matchId && matches.length > 0) {
      const match = matches.find(m => m.id === matchId);
      if (match) {
        console.log('🔄 Setting selected match from URL:', match.id);
        setSelectedMatch(match);
        
        // Check if we have cached messages for this match
        const cachedMessages = messageHistory.get(matchId);
        if (cachedMessages) {
          console.log('📄 Loading cached messages for match:', matchId);
          setMessages(cachedMessages);
        } else {
          console.log('🔄 Fetching fresh messages for match:', matchId);
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
  }, [matchId, matches.length]); // Removed selectedMatch from dependencies to prevent infinite loop

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

      // Fetch user profiles and unread message counts for each match
      const matchesWithProfiles = await Promise.all(
        (data || []).map(async (match) => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, location, about_me, ms_subtype, diagnosis_year, date_of_birth, hobbies, symptoms, medications')
            .eq('user_id', otherUserId)
            .single();

          // Get unread message count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', match.id)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

          return {
            ...match,
            other_user: profileData || {
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
              medications: []
            },
            unread_count: unreadCount || 0
          };
        })
      );

      setMatches(matchesWithProfiles);
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

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
      
      // Cache the messages for this match
      setMessageHistory(prev => new Map(prev.set(matchId, data || [])));
      
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('match_id', matchId)
        .eq('receiver_id', user.id);

      // Update unread count for this match
      setMatches(prev => prev.map(match => 
        match.id === matchId ? { ...match, unread_count: 0 } : match
      ));
    } catch (error) {
      console.error('Error fetching messages:', error);
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

  const sendMessage = async () => {
    if (!user || !selectedMatch || !newMessage.trim()) return;

    setSending(true);
    const receiverId = selectedMatch.user1_id === user.id 
      ? selectedMatch.user2_id 
      : selectedMatch.user1_id;

    try {
      console.log('🚀 Attempting to send message:', {
        match_id: selectedMatch.id,
        sender_id: user.id,
        receiver_id: receiverId,
        content: newMessage.trim()
      });

      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: selectedMatch.id,
          sender_id: user.id,
          receiver_id: receiverId,
          content: newMessage.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error sending message:', error);
        alert(`Error sending message: ${error.message}`);
        return;
      }

      console.log('✅ Message sent successfully:', data);

      const updatedMessages = [...messages, data];
      setMessages(updatedMessages);
      
      // Update cached messages for this match
      setMessageHistory(prev => new Map(prev.set(selectedMatch.id, updatedMessages)));
      setNewMessage("");
      
      // Track message sent
      analytics.messageSent(user.id, receiverId, newMessage.trim().length);
      
      // Update unread count for this match
      setMatches(prev => prev.map(match => 
        match.id === selectedMatch.id ? { ...match, unread_count: 0 } : match
      ));

      // Send email notification for new message (non-blocking)
      try {
        console.log('📧 Sending message email notification...');
        const emailResult = await supabase.functions.invoke('email-notification-worker', {
          body: {
            type: 'message',
            likerUserId: user.id,
            likedUserId: receiverId,
            messageContent: newMessage.trim()
          }
        });
        
        if (emailResult.error) {
          console.warn('⚠️ Email notification failed (non-critical):', emailResult.error);
        } else {
          console.log('✅ Message email notification sent successfully');
        }
      } catch (emailError) {
        console.warn('⚠️ Email notification failed (non-critical):', emailError);
        // Don't fail the message send if email fails - this is non-critical
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedMatch && messages !== null) {
    return (
      <div className="flex flex-col h-[600px]">
        {/* Chat Header */}
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <Button variant="ghost" size="sm" onClick={() => {setSelectedMatch(null); setMessages([]);}} className="mr-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Avatar className="w-10 h-10 mr-3">
            <AvatarImage src={selectedMatch.other_user.avatar_url || undefined} />
            <AvatarFallback>
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">
              {selectedMatch.other_user.first_name} {selectedMatch.other_user.last_name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isUserOnline(selectedMatch.user1_id === user?.id ? selectedMatch.user2_id : selectedMatch.user1_id) ? 'bg-green-500' : 'bg-gray-400'}`} />
              <p className="text-sm text-muted-foreground">
                {isUserOnline(selectedMatch.user1_id === user?.id ? selectedMatch.user2_id : selectedMatch.user1_id) ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="mr-2">
                <Eye className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedMatch.other_user.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedMatch.other_user.first_name} {selectedMatch.other_user.last_name}
                    </h3>
                    {selectedMatch.other_user.location && (
                      <p className="text-sm text-muted-foreground">{selectedMatch.other_user.location}</p>
                    )}
                  </div>
                </div>
                
                {selectedMatch.other_user.ms_subtype && (
                  <div>
                    <h4 className="font-semibold mb-1">MS Type</h4>
                    <p className="text-sm text-muted-foreground">{selectedMatch.other_user.ms_subtype}</p>
                  </div>
                )}
                
                {selectedMatch.other_user.diagnosis_year && (
                  <div>
                    <h4 className="font-semibold mb-1">Diagnosed</h4>
                    <p className="text-sm text-muted-foreground">{selectedMatch.other_user.diagnosis_year}</p>
                  </div>
                )}
                
                {selectedMatch.other_user.hobbies && selectedMatch.other_user.hobbies.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1">Interests</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedMatch.other_user.hobbies.slice(0, 6).map((hobby, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {hobby}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedMatch.other_user.about_me && (
                  <div>
                    <h4 className="font-semibold mb-1">About</h4>
                    <p className="text-sm text-muted-foreground">{selectedMatch.other_user.about_me}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Match</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this match? This will permanently delete your conversation with {selectedMatch.other_user.first_name}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => removeMatch(selectedMatch.id)} className="bg-destructive hover:bg-destructive/90">
                  Remove Match
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[400px] px-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] space-y-1`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.sender_id === user?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground px-2">
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {selectedMatch && getTypingUsers(selectedMatch.id).filter(id => id !== user?.id).length > 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] space-y-1">
                    <div className="rounded-lg px-4 py-2 bg-muted text-foreground">
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">typing...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        {/* Message Input */}
        <div className="p-6 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || sending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Your Matches</h2>
      {matches.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No matches yet. Start discovering to find your community!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <Card key={match.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                 <div 
                   className="flex items-center space-x-4"
                   onClick={() => {
                     console.log('🖱️ Match card clicked for match:', match.id);
                     setSelectedMatch(match);
                     if (!messageHistory.has(match.id)) {
                       fetchMessages(match.id);
                     } else {
                       setMessages(messageHistory.get(match.id) || []);
                     }
                   }}
                 >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={match.other_user.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      isUserOnline(match.user1_id === user?.id ? match.user2_id : match.user1_id) ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {match.other_user.first_name} {match.other_user.last_name}
                      </h3>
                      {match.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs px-2">
                          {match.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Matched {formatTime(match.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🖱️ Chat button clicked for match:', match.id);
                        setSelectedMatch(match);
                        if (!messageHistory.has(match.id)) {
                          fetchMessages(match.id);
                        } else {
                          setMessages(messageHistory.get(match.id) || []);
                        }
                      }}
                    >
                      Chat
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Match</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this match? This will permanently delete your conversation with {match.other_user.first_name}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeMatch(match.id)} className="bg-destructive hover:bg-destructive/90">
                            Remove Match
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messaging;