-- Add ON DELETE CASCADE constraints to handle match removal properly
-- This ensures messages are automatically deleted when a match is removed

-- First drop existing foreign key if it exists and recreate with CASCADE
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_match_id_fkey;

-- Add foreign key constraint with CASCADE delete
ALTER TABLE public.messages 
ADD CONSTRAINT messages_match_id_fkey 
FOREIGN KEY (match_id) REFERENCES public.matches(id) 
ON DELETE CASCADE;

-- Add realtime for messages table to get instant unread count updates
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.messages;