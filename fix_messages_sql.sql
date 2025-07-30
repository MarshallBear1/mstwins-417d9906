-- SQL script to fix message moderation status
-- Run this in your Supabase SQL editor to make existing messages visible again

-- 1. First, let's see what moderation statuses exist
SELECT moderation_status, COUNT(*) as message_count 
FROM messages 
GROUP BY moderation_status;

-- 2. Update all existing messages to 'approved' status so they become visible
UPDATE messages 
SET moderation_status = 'approved', 
    updated_at = now()
WHERE moderation_status = 'pending' 
   OR moderation_status IS NULL;

-- 3. Change the default for new messages to 'approved'
ALTER TABLE messages 
ALTER COLUMN moderation_status SET DEFAULT 'approved';

-- 4. Verify the fix worked
SELECT moderation_status, COUNT(*) as message_count 
FROM messages 
GROUP BY moderation_status;

-- 5. Show recent messages to verify they're visible
SELECT id, sender_id, receiver_id, content, moderation_status, created_at
FROM messages 
ORDER BY created_at DESC 
LIMIT 10;