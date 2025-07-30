-- Add reply functionality to forum comments
ALTER TABLE public.forum_comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE;

-- Create index for better performance when fetching comment threads
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent_id ON public.forum_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_parent ON public.forum_comments(post_id, parent_comment_id);

-- Add trigger to send notifications for comment replies
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  parent_comment_author_id UUID;
  parent_comment_author_name TEXT;
  post_title TEXT;
BEGIN
  -- Only send notification if this is a reply to another comment
  IF NEW.parent_comment_id IS NOT NULL THEN
    -- Get the parent comment author
    SELECT author_id INTO parent_comment_author_id
    FROM public.forum_comments
    WHERE id = NEW.parent_comment_id;
    
    -- Don't notify if replying to your own comment
    IF parent_comment_author_id != NEW.author_id THEN
      -- Get the parent comment author name
      SELECT first_name INTO parent_comment_author_name
      FROM public.profiles
      WHERE user_id = parent_comment_author_id;
      
      -- Get the post title
      SELECT title INTO post_title
      FROM public.forum_posts
      WHERE id = NEW.post_id;
      
      -- Create notification
      INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
      VALUES (
        parent_comment_author_id,
        'comment_reply',
        'Someone replied to your comment',
        'Someone replied to your comment on "' || COALESCE(post_title, 'a post') || '"',
        NEW.author_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for comment reply notifications
DROP TRIGGER IF EXISTS trigger_comment_reply_notification ON public.forum_comments;
CREATE TRIGGER trigger_comment_reply_notification
  AFTER INSERT ON public.forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_reply();