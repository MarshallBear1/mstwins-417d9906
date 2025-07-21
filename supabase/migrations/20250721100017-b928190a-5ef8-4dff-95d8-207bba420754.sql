-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Ensure notifications table is also in realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;