-- Add trigger for message notifications to prevent duplicates
DROP TRIGGER IF EXISTS create_message_notification_trigger ON public.messages;

-- Create trigger for message notifications
CREATE TRIGGER create_message_notification_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_notification();