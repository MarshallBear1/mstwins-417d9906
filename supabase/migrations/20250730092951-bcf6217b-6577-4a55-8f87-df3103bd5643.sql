-- URGENT: Fix deleted chat history by making all messages visible
UPDATE messages 
SET moderation_status = 'approved'
WHERE moderation_status IS NULL 
   OR moderation_status != 'approved';

-- Set default for new messages to be automatically approved
ALTER TABLE messages 
ALTER COLUMN moderation_status SET DEFAULT 'approved';

-- Also update any forum posts and comments that might be hidden
UPDATE forum_posts 
SET moderation_status = 'approved'
WHERE moderation_status IS NULL 
   OR moderation_status != 'approved';

UPDATE forum_comments 
SET moderation_status = 'approved'
WHERE moderation_status IS NULL 
   OR moderation_status != 'approved';