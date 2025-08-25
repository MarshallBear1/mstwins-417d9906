import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  participants: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  }[];
}

interface MobileMessagingProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const MobileMessaging = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  isLoading = false
}: MobileMessagingProps) => {
  const { buttonPress, message: messageHaptic } = useHaptics();
  const [newMessage, setNewMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim() && !isLoading) {
      messageHaptic();
      onSendMessage(newMessage.trim());
      setNewMessage('');
      setIsComposing(false);
    }
  };

  const handleInputFocus = () => {
    setIsComposing(true);
    // Scroll to bottom after keyboard appears
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const handleInputBlur = () => {
    if (!newMessage.trim()) {
      setIsComposing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            buttonPress();
            onBack();
          }}
          className="p-2 -ml-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <Avatar className="w-10 h-10">
          <AvatarImage src={otherParticipant?.avatar_url} />
          <AvatarFallback>
            {otherParticipant?.first_name?.[0]}{otherParticipant?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">
            {otherParticipant?.first_name} {otherParticipant?.last_name}
          </h3>
          <p className="text-xs text-muted-foreground">Active now</p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="p-2">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.sender_id === currentUserId;
          const showAvatar = !isOwn && (
            index === 0 || 
            messages[index - 1]?.sender_id !== message.sender_id
          );

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 max-w-[85%]",
                isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              {showAvatar && !isOwn && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={otherParticipant?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {otherParticipant?.first_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              )}
              
              {!showAvatar && !isOwn && <div className="w-8" />}

              <div
                className={cn(
                  "px-4 py-2 rounded-2xl max-w-full break-words",
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}
              >
                <p className="text-sm">{message.content}</p>
                <p className={cn(
                  "text-xs mt-1 opacity-70",
                  isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {new Date(message.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className={cn(
        "border-t border-border bg-card px-4 py-3 transition-all duration-300",
        isComposing ? "pb-6" : "pb-3"
      )}>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="pr-12 bg-background border-border rounded-full"
              disabled={isLoading}
            />
          </div>
          
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isLoading}
            size="sm"
            className="rounded-full w-10 h-10 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileMessaging;