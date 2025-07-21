-- Drop the existing trigger first
DROP TRIGGER IF EXISTS create_message_notification_trigger ON public.messages;

-- Now recreate it 
CREATE TRIGGER create_message_notification_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_notification();