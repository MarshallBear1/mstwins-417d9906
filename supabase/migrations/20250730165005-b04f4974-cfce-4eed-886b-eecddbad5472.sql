-- Update the notify_comment_reply function to also notify post authors of new comments
CREATE OR REPLACE FUNCTION public.notify_comment_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  parent_comment_author_id UUID;
  parent_comment_author_name TEXT;
  post_author_id UUID;
  post_author_name TEXT;
  post_title TEXT;
BEGIN
  -- Get post details
  SELECT author_id, title INTO post_author_id, post_title
  FROM public.forum_posts
  WHERE id = NEW.post_id;
  
  -- Get post author name
  SELECT first_name INTO post_author_name
  FROM public.profiles
  WHERE user_id = post_author_id;
  
  -- If this is a reply to another comment, notify the parent comment author
  IF NEW.parent_comment_id IS NOT NULL THEN
    -- Get the parent comment author
    SELECT author_id INTO parent_comment_author_id
    FROM public.forum_comments
    WHERE id = NEW.parent_comment_id;
    
    -- Don't notify if replying to your own comment
    IF parent_comment_author_id != NEW.author_id THEN
      -- Create notification for reply
      INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
      VALUES (
        parent_comment_author_id,
        'comment_reply',
        'Someone replied to your comment',
        'Someone replied to your comment on "' || COALESCE(post_title, 'a post') || '"',
        NEW.author_id
      );
    END IF;
  ELSE
    -- This is a top-level comment, notify the post author
    IF post_author_id != NEW.author_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
      VALUES (
        post_author_id,
        'forum_comment',
        'New comment on your post',
        'Someone commented on your post "' || COALESCE(post_title, 'your post') || '"',
        NEW.author_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add a user setting to hide from discover page
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hide_from_discover BOOLEAN DEFAULT FALSE;

-- Update your specific profile to hide from discover
UPDATE public.profiles 
SET hide_from_discover = TRUE 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'MSTwins@gmail.com'
);