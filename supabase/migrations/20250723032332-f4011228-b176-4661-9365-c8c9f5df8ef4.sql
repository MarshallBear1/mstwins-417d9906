-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_like_created ON public.likes;
DROP TRIGGER IF EXISTS on_message_created ON public.messages;

-- Enhanced like trigger function that calls email worker
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

    -- Send match emails via edge function (background job)
    PERFORM
      net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/email-notification-worker',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
          'type', 'match',
          'likerUserId', NEW.liker_id,
          'likedUserId', NEW.liked_id
        )
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

    -- Send like email via edge function (background job)
    PERFORM
      net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/email-notification-worker',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
          'type', 'like',
          'likerUserId', NEW.liker_id,
          'likedUserId', NEW.liked_id
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Enhanced message notification function that calls email worker
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

  -- Send message email via edge function (background job)
  PERFORM
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/email-notification-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'message',
        'likerUserId', NEW.sender_id,
        'likedUserId', NEW.receiver_id,
        'messageContent', CASE 
          WHEN length(NEW.content) > 100 
          THEN substring(NEW.content from 1 for 100) || '...'
          ELSE NEW.content
        END
      )
    );
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_on_mutual_like();

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_notification();

-- Set up configuration for the triggers
SELECT set_config('app.settings.supabase_url', current_setting('SUPABASE_URL', true), false);
SELECT set_config('app.settings.service_role_key', current_setting('SUPABASE_SERVICE_ROLE_KEY', true), false);