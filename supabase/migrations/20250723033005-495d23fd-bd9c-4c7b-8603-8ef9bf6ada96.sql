-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_like_created ON public.likes;
DROP TRIGGER IF EXISTS on_message_created ON public.messages;

-- Create a simpler, more reliable approach using a notification queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('like', 'match', 'message')),
  liker_user_id UUID NOT NULL,
  liked_user_id UUID NOT NULL,
  message_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  last_attempt TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Enable RLS on email queue
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for email queue
CREATE POLICY "System can manage email queue" ON public.email_queue FOR ALL USING (true);

-- Enhanced like trigger function that adds to email queue
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_mutual_like BOOLEAN := FALSE;
BEGIN
  -- Check if there's already a like from the liked user to the liker (mutual like)
  SELECT EXISTS (
    SELECT 1 FROM public.likes 
    WHERE liker_id = NEW.liked_id 
    AND liked_id = NEW.liker_id
  ) INTO is_mutual_like;

  IF is_mutual_like THEN
    -- Create a match (ensure consistent ordering)
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.liker_id, NEW.liked_id),
      GREATEST(NEW.liker_id, NEW.liked_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
    
    -- Create notifications for both users (with duplicate prevention)
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    SELECT NEW.liker_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liked_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = NEW.liker_id 
      AND type = 'match' 
      AND from_user_id = NEW.liked_id 
      AND created_at > NOW() - INTERVAL '1 minute'
    );
    
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    SELECT NEW.liked_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liker_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = NEW.liked_id 
      AND type = 'match' 
      AND from_user_id = NEW.liker_id 
      AND created_at > NOW() - INTERVAL '1 minute'
    );

    -- Queue match email for reliable delivery
    INSERT INTO public.email_queue (type, liker_user_id, liked_user_id)
    VALUES ('match', NEW.liker_id, NEW.liked_id);
    
  ELSE
    -- Create a like notification for the liked user (with duplicate prevention)
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    SELECT NEW.liked_id, 'like', 'Someone liked you!', 'You have a new like! Check it out.', NEW.liker_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = NEW.liked_id 
      AND type = 'like' 
      AND from_user_id = NEW.liker_id 
      AND created_at > NOW() - INTERVAL '1 minute'
    );

    -- Queue like email for reliable delivery
    INSERT INTO public.email_queue (type, liker_user_id, liked_user_id)
    VALUES ('like', NEW.liker_id, NEW.liked_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Enhanced message notification function that adds to email queue
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only create notification for the receiver (with duplicate prevention)
  INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
  SELECT NEW.receiver_id, 'message', 'New Message', 'You have a new message!', NEW.sender_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.notifications 
    WHERE user_id = NEW.receiver_id 
    AND type = 'message' 
    AND from_user_id = NEW.sender_id 
    AND created_at > NOW() - INTERVAL '30 seconds'
  );

  -- Queue message email for reliable delivery
  INSERT INTO public.email_queue (type, liker_user_id, liked_user_id, message_content)
  VALUES ('message', NEW.sender_id, NEW.receiver_id, 
    CASE 
      WHEN length(NEW.content) > 100 
      THEN substring(NEW.content from 1 for 100) || '...'
      ELSE NEW.content
    END
  );
  
  RETURN NEW;
END;
$$;

-- Create the triggers
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_on_mutual_like();

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_notification();

-- Create an index for efficient email queue processing
CREATE INDEX IF NOT EXISTS idx_email_queue_processing ON public.email_queue (processed, created_at) WHERE processed = false;