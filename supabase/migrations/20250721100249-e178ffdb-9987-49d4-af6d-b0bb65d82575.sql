-- Drop the problematic trigger that's causing the net schema error
DROP TRIGGER IF EXISTS send_message_notification_trigger ON public.messages;

-- Drop the function that uses net schema
DROP FUNCTION IF EXISTS public.send_message_notification();

-- Create a simpler notification trigger that doesn't use HTTP
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only create notification for the receiver
  INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
  VALUES (NEW.receiver_id, 'message', 'New Message', 'You have a new message!', NEW.sender_id);
  
  RETURN NEW;
END;
$function$;

-- Create the trigger for message notifications
CREATE TRIGGER create_message_notification_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_notification();