-- Remove the problematic trigger that still exists and uses net schema
DROP TRIGGER IF EXISTS trigger_message_notification ON public.messages;

-- Also drop the function that uses net schema to be sure
DROP FUNCTION IF EXISTS public.send_message_notification() CASCADE;