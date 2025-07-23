-- Create a cron job to process emails every 2 minutes
-- First, enable the required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule email processing to run every 2 minutes
SELECT cron.schedule(
  'process-email-queue',
  '*/2 * * * *', -- every 2 minutes
  $$
  SELECT net.http_post(
    url := 'https://fscendubnktdtmnxiipk.supabase.co/functions/v1/email-processor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzY2VuZHVibmt0ZHRtbnhpaXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODEzMTcsImV4cCI6MjA2ODY1NzMxN30.F4TeAOAW2R_8di-9B-oz7jodfb9SS3HE1RAyeJGgaMY"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);