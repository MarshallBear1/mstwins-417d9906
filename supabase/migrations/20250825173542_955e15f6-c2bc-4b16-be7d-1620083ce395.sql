-- Fix notification/email system issues

-- 1. Enable email processing (was disabled since August 7th)
UPDATE public.system_flags 
SET enabled = true 
WHERE flag_name = 'email_processing_enabled';

-- 2. Add proper indexes for better email queue performance
CREATE INDEX IF NOT EXISTS idx_email_queue_processed_created 
ON public.email_queue (processed, created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON public.notifications (user_id, created_at DESC);

-- 3. Create a function to manually process stuck email queue
CREATE OR REPLACE FUNCTION public.process_stuck_email_queue()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  processed_count integer := 0;
  email_record record;
BEGIN
  -- Only process emails that are less than 24 hours old and haven't been attempted
  FOR email_record IN 
    SELECT id FROM public.email_queue 
    WHERE processed = false 
    AND attempts = 0
    AND created_at > now() - interval '24 hours'
    ORDER BY created_at ASC
    LIMIT 50
  LOOP
    -- Mark as attempted to prevent infinite loops
    UPDATE public.email_queue 
    SET attempts = 1, last_attempt = now()
    WHERE id = email_record.id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  -- Trigger the email processor function
  PERFORM net.http_post(
    url := 'https://fscendubnktdtmnxiipk.supabase.co/functions/v1/email-processor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzY2VuZHVibmt0ZHRtbnhpaXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODEzMTcsImV4cCI6MjA2ODY1NzMxN30.F4TeAOAW2R_8di-9B-oz7jodfb9SS3HE1RAyeJGgaMY"}'::jsonb,
    body := '{"manual_trigger": true}'::jsonb
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'emails_marked_for_processing', processed_count,
    'message', 'Email processing re-enabled and queue triggered'
  );
END;
$function$;

-- 4. Add better error handling for push notification logs
CREATE OR REPLACE FUNCTION public.log_push_notification_result(
  user_id_param uuid,
  notification_type text,
  title_param text,
  body_param text,
  result_data jsonb DEFAULT '{}' 
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.notification_logs (
    user_id, type, title, body, results, sent_at
  ) VALUES (
    user_id_param, notification_type, title_param, body_param, result_data, now()
  );
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the notification
  NULL;
END;
$function$;