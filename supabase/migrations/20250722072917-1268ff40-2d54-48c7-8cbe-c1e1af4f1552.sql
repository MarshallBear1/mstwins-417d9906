-- Fix duplicate notifications by ensuring uniqueness

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_like_created ON public.likes;
DROP TRIGGER IF EXISTS on_message_created ON public.messages;

-- Create improved trigger for likes/matches with duplicate prevention
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if there's already a like from the liked user to the liker (mutual like)
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
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create improved trigger for message notifications with duplicate prevention
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
  
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_on_mutual_like();

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_notification();