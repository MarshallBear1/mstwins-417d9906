-- Create notification_logs table to track sent notifications
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for notification_logs
CREATE POLICY "System can manage notification logs" 
ON public.notification_logs 
FOR ALL 
USING (true);

-- Update the create_match_on_mutual_like function to send push notifications
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  is_mutual_like BOOLEAN := FALSE;
  existing_match_id UUID;
  liker_name TEXT;
  liked_name TEXT;
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
      
      -- Get user names for notifications
      SELECT first_name INTO liker_name FROM public.profiles WHERE user_id = NEW.liker_id;
      SELECT first_name INTO liked_name FROM public.profiles WHERE user_id = NEW.liked_id;
      
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

      -- Send push notifications for match (async)
      PERFORM net.http_post(
        url := 'https://fscendubnktdtmnxiipk.supabase.co/functions/v1/send-push-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzY2VuZHVibmt0ZHRtbnhpaXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODEzMTcsImV4cCI6MjA2ODY1NzMxN30.F4TeAOAW2R_8di-9B-oz7jodfb9SS3HE1RAyeJGgaMY"}'::jsonb,
        body := json_build_object(
          'user_id', NEW.liker_id,
          'title', '🎉 New Match!',
          'body', 'You matched with ' || COALESCE(liked_name, 'someone') || '! Start chatting now.',
          'type', 'match',
          'data', json_build_object('match_user_id', NEW.liked_id, 'match_name', liked_name)
        )::jsonb
      );

      PERFORM net.http_post(
        url := 'https://fscendubnktdtmnxiipk.supabase.co/functions/v1/send-push-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzY2VuZHVibmt0ZHRtbnhpaXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODEzMTcsImV4cCI6MjA2ODY1NzMxN30.F4TeAOAW2R_8di-9B-oz7jodfb9SS3HE1RAyeJGgaMY"}'::jsonb,
        body := json_build_object(
          'user_id', NEW.liked_id,
          'title', '🎉 New Match!',
          'body', 'You matched with ' || COALESCE(liker_name, 'someone') || '! Start chatting now.',
          'type', 'match',
          'data', json_build_object('match_user_id', NEW.liker_id, 'match_name', liker_name)
        )::jsonb
      );
    END IF;
    
  ELSE
    -- Get liker name for like notification
    SELECT first_name INTO liker_name FROM public.profiles WHERE user_id = NEW.liker_id;
    
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

    -- Send push notification for like (async)
    PERFORM net.http_post(
      url := 'https://fscendubnktdtmnxiipk.supabase.co/functions/v1/send-push-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzY2VuZHVibmt0ZHRtbnhpaXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODEzMTcsImV4cCI6MjA2ODY1NzMxN30.F4TeAOAW2R_8di-9B-oz7jodfb9SS3HE1RAyeJGgaMY"}'::jsonb,
      body := json_build_object(
        'user_id', NEW.liked_id,
        'title', '💙 Someone liked you!',
        'body', COALESCE(liker_name, 'Someone') || ' liked your profile. Check it out!',
        'type', 'like',
        'data', json_build_object('liker_user_id', NEW.liker_id, 'liker_name', liker_name)
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the create_message_notification function to send push notifications
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get sender name for notification
  SELECT first_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
  
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

  -- Send push notification for message (async)
  PERFORM net.http_post(
    url := 'https://fscendubnktdtmnxiipk.supabase.co/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzY2VuZHVibmt0ZHRtbnhpaXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODEzMTcsImV4cCI6MjA2ODY1NzMxN30.F4TeAOAW2R_8di-9B-oz7jodfb9SS3HE1RAyeJGgaMY"}'::jsonb,
    body := json_build_object(
      'user_id', NEW.receiver_id,
      'title', '💬 Message from ' || COALESCE(sender_name, 'Someone'),
      'body', CASE 
        WHEN length(NEW.content) > 50 
        THEN substring(NEW.content from 1 for 50) || '...'
        ELSE NEW.content
      END,
      'type', 'message',
      'data', json_build_object(
        'sender_user_id', NEW.sender_id, 
        'sender_name', sender_name,
        'message_id', NEW.id,
        'message_content', NEW.content
      )
    )::jsonb
  );
  
  RETURN NEW;
END;
$function$;