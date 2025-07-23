-- Fix the duplicate email issues and message email flow

-- 1. Remove duplicate triggers that are causing multiple emails
DROP TRIGGER IF EXISTS on_like_created ON public.likes;
DROP TRIGGER IF EXISTS trigger_match_on_like ON public.likes;
DROP TRIGGER IF EXISTS on_message_created ON public.messages;

-- 2. The create_match_on_mutual_like_trigger should handle likes and matches
-- But the create_message_notification_trigger should handle messages
-- Let's keep: create_match_on_mutual_like_trigger and create_message_notification_trigger

-- 3. Fix database function return types that are causing errors
-- First check what the actual functions expect vs what they return

-- 4. Update the message trigger to be more robust and prevent duplicates
CREATE OR REPLACE FUNCTION public.create_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only create notification for the receiver (with strict duplicate prevention)
  INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
  SELECT NEW.receiver_id, 'message', 'New Message', 'You have a new message!', NEW.sender_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.notifications 
    WHERE user_id = NEW.receiver_id 
    AND type = 'message' 
    AND from_user_id = NEW.sender_id 
    AND created_at > NOW() - INTERVAL '1 minute'
  );

  -- Queue message email for reliable delivery (with duplicate prevention)
  INSERT INTO public.email_queue (type, liker_user_id, liked_user_id, message_content)
  SELECT 'message', NEW.sender_id, NEW.receiver_id, 
    CASE 
      WHEN length(NEW.content) > 100 
      THEN substring(NEW.content from 1 for 100) || '...'
      ELSE NEW.content
    END
  WHERE NOT EXISTS (
    SELECT 1 FROM public.email_queue 
    WHERE type = 'message' 
    AND liker_user_id = NEW.sender_id 
    AND liked_user_id = NEW.receiver_id 
    AND message_content = CASE 
      WHEN length(NEW.content) > 100 
      THEN substring(NEW.content from 1 for 100) || '...'
      ELSE NEW.content
    END
    AND created_at > NOW() - INTERVAL '30 seconds'
  );
  
  RETURN NEW;
END;
$function$;

-- 5. Update the like trigger to prevent duplicate matches
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  is_mutual_like BOOLEAN := FALSE;
  existing_match_id UUID;
BEGIN
  -- Check if there's already a like from the liked user to the liker (mutual like)
  SELECT EXISTS (
    SELECT 1 FROM public.likes 
    WHERE liker_id = NEW.liked_id 
    AND liked_id = NEW.liker_id
  ) INTO is_mutual_like;

  IF is_mutual_like THEN
    -- Check if match already exists
    SELECT id INTO existing_match_id
    FROM public.matches 
    WHERE (user1_id = LEAST(NEW.liker_id, NEW.liked_id) AND user2_id = GREATEST(NEW.liker_id, NEW.liked_id));
    
    -- Only create match if it doesn't exist
    IF existing_match_id IS NULL THEN
      INSERT INTO public.matches (user1_id, user2_id)
      VALUES (
        LEAST(NEW.liker_id, NEW.liked_id),
        GREATEST(NEW.liker_id, NEW.liked_id)
      );
      
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

      -- Queue match email for reliable delivery (with duplicate prevention)
      INSERT INTO public.email_queue (type, liker_user_id, liked_user_id)
      SELECT 'match', NEW.liker_id, NEW.liked_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.email_queue 
        WHERE type = 'match' 
        AND ((liker_user_id = NEW.liker_id AND liked_user_id = NEW.liked_id) 
             OR (liker_user_id = NEW.liked_id AND liked_user_id = NEW.liker_id))
        AND created_at > NOW() - INTERVAL '30 seconds'
      );
    END IF;
    
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

    -- Queue like email for reliable delivery (with duplicate prevention)
    INSERT INTO public.email_queue (type, liker_user_id, liked_user_id)
    SELECT 'like', NEW.liker_id, NEW.liked_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.email_queue 
      WHERE type = 'like' 
      AND liker_user_id = NEW.liker_id 
      AND liked_user_id = NEW.liked_id 
      AND created_at > NOW() - INTERVAL '30 seconds'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;