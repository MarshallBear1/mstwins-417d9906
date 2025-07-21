-- Create a trigger function to send message notification emails
CREATE OR REPLACE FUNCTION public.send_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Send message email notification using the email worker
  PERFORM net.http_post(
    url := 'https://fscendubnktdtmnxiipk.functions.supabase.co/functions/v1/email-notification-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', 'message',
      'likerUserId', NEW.sender_id::text,
      'likedUserId', NEW.receiver_id::text,
      'messageContent', NEW.content
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger to send email notification after message insert
DROP TRIGGER IF EXISTS trigger_message_notification ON public.messages;
CREATE TRIGGER trigger_message_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.send_message_notification();