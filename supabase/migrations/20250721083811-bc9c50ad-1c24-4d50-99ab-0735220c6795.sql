-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'match', 'like', 'message'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  from_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Create matches table if it doesn't exist
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Create likes table if it doesn't exist
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  liker_id UUID NOT NULL,
  liked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(liker_id, liked_id)
);

-- Enable RLS on all tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications for others" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = from_user_id OR from_user_id IS NULL);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages they sent or received" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = receiver_id);

-- Matches policies
CREATE POLICY "Users can view their own matches" 
ON public.matches 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can create matches" 
ON public.matches 
FOR INSERT 
WITH CHECK (true);

-- Likes policies
CREATE POLICY "Users can view likes they gave or received" 
ON public.likes 
FOR SELECT 
USING (auth.uid() = liker_id OR auth.uid() = liked_id);

CREATE POLICY "Users can create likes" 
ON public.likes 
FOR INSERT 
WITH CHECK (auth.uid() = liker_id);

CREATE POLICY "Users can delete likes they gave" 
ON public.likes 
FOR DELETE 
USING (auth.uid() = liker_id);

-- Function to create match when mutual like exists
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's already a like from the liked user to the liker
  IF EXISTS (
    SELECT 1 FROM public.likes 
    WHERE liker_id = NEW.liked_id 
    AND liked_id = NEW.liker_id
  ) THEN
    -- Create a match (ensure consistent ordering)
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.liker_id, NEW.liked_id),
      GREATEST(NEW.liker_id, NEW.liked_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
    
    -- Create notifications for both users
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    VALUES 
    (NEW.liker_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liked_id),
    (NEW.liked_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liker_id);
  ELSE
    -- Create a like notification
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    VALUES (NEW.liked_id, 'like', 'Someone liked you!', 'You have a new like! Check it out.', NEW.liker_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic match creation
CREATE TRIGGER create_match_on_mutual_like_trigger
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION create_match_on_mutual_like();

-- Function to create message notification
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
  VALUES (NEW.receiver_id, 'message', 'New Message', 'You have a new message!', NEW.sender_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message notifications
CREATE TRIGGER create_message_notification_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION create_message_notification();