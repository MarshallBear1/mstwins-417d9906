-- Improve email deduplication and add rate limiting protections

-- 1. Add better deduplication - extend the duplicate prevention window to 5 minutes
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
  
  -- Only create notification for the receiver with enhanced duplicate prevention (5 minute window)
  INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
  SELECT NEW.receiver_id, 'message', 'New Message', 'You have a new message!', NEW.sender_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.notifications 
    WHERE user_id = NEW.receiver_id 
    AND type = 'message' 
    AND from_user_id = NEW.sender_id 
    AND created_at > NOW() - INTERVAL '5 minutes'
  );

  -- Queue message email with enhanced duplicate prevention (5 minute window)
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
    AND created_at > NOW() - INTERVAL '5 minutes'
  );

  -- Send push notification for message (async)
  PERFORM net.http_post(
    url := 'https://fscendubnktdtmnxiipk.supabase.co/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzY2VuZHVibmt0ZHRtbnhpaXBrIiwicm9sZUI6ImFub24iLCJpYXQiOjE3NTMwODEzMTcsImV4cCI6MjA2ODY1NzMxN30.F4TeAOAW2R_8di-9B-oz7jodfb9SS3HE1RAyeJGgaMY"}'::jsonb,
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

-- 2. Clean up old processed emails to prevent table bloat
DELETE FROM public.email_queue 
WHERE processed = true 
AND created_at < NOW() - INTERVAL '30 days';

-- 3. Update system flag to keep email processing disabled until rate limiting is confirmed working
UPDATE public.system_flags 
SET enabled = false 
WHERE flag_name = 'email_processing_enabled';