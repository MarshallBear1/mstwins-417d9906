-- Fix message moderation status - approve all existing messages
-- This resolves the issue where messages were stuck in 'pending' status

-- Update all existing messages to 'approved' status 
-- This makes them visible in the chat interface again
UPDATE public.messages 
SET moderation_status = 'approved', 
    updated_at = now()
WHERE moderation_status = 'pending' 
   OR moderation_status IS NULL;

-- Update the default for new messages to be 'approved' by default
-- since we're doing client-side filtering
ALTER TABLE public.messages 
ALTER COLUMN moderation_status SET DEFAULT 'approved';

-- Add a comment explaining the moderation strategy
COMMENT ON COLUMN public.messages.moderation_status IS 
'Message moderation status: approved (visible), pending (under review), blocked (hidden). Default is approved since client-side filtering is applied.';