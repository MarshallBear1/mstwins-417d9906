-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the email queue processor to run every 2 minutes
SELECT cron.schedule(
  'process-email-queue',
  '*/2 * * * *', -- every 2 minutes
  $$
  SELECT
    net.http_post(
        url := 'https://fscendubnktdtmnxiipk.supabase.co/functions/v1/process-email-queue',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzY2VuZHVibmt0ZHRtbnhpaXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODEzMTcsImV4cCI6MjA2ODY1NzMxN30.F4TeAOAW2R_8di-9B-oz7jodfb9SS3HE1RAyeJGgaMY"}'::jsonb,
        body := '{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Create a function to manually trigger email queue processing
CREATE OR REPLACE FUNCTION public.trigger_email_queue_processing()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT net.http_post(
    url := 'https://fscendubnktdtmnxiipk.supabase.co/functions/v1/process-email-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzY2VuZHVibmt0ZHRtbnhpaXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODEzMTcsImV4cCI6MjA2ODY1NzMxN30.F4TeAOAW2R_8di-9B-oz7jodfb9SS3HE1RAyeJGgaMY"}'::jsonb,
    body := '{"manual_trigger": true}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;