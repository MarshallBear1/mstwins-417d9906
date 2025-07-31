-- Create a trigger function to notify users about new forum posts
CREATE OR REPLACE FUNCTION public.notify_forum_post_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  post_author_name TEXT;
  flair_emoji TEXT := '📝';
  flair_label TEXT;
BEGIN
  -- Get the author's name
  SELECT first_name INTO post_author_name
  FROM public.profiles
  WHERE user_id = NEW.author_id;
  
  -- Get flair info based on the flair value
  CASE NEW.flair
    WHEN 'general' THEN flair_emoji := '💬'; flair_label := 'General Discussion';
    WHEN 'support' THEN flair_emoji := '🤝'; flair_label := 'Support & Advice';
    WHEN 'symptoms' THEN flair_emoji := '🩺'; flair_label := 'Symptoms & Health';
    WHEN 'treatment' THEN flair_emoji := '💊'; flair_label := 'Treatment & Medication';
    WHEN 'lifestyle' THEN flair_emoji := '🌱'; flair_label := 'Lifestyle & Wellness';
    WHEN 'success' THEN flair_emoji := '🎉'; flair_label := 'Success Stories';
    WHEN 'research' THEN flair_emoji := '🔬'; flair_label := 'Research & News';
    WHEN 'relationships' THEN flair_emoji := '❤️'; flair_label := 'Relationships & Dating';
    ELSE flair_emoji := '📝'; flair_label := 'General';
  END CASE;
  
  -- Create notifications for all users except the post author
  -- Only notify a subset (50 most recent users) to prevent overwhelming the system
  INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
  SELECT 
    p.user_id,
    'forum_post',
    flair_emoji || ' New Forum Post',
    'New post in ' || flair_label || ': "' || 
    CASE 
      WHEN length(NEW.title) > 50 THEN substring(NEW.title from 1 for 50) || '...'
      ELSE NEW.title
    END || '"',
    NEW.author_id
  FROM public.profiles p
  WHERE p.user_id != NEW.author_id
  ORDER BY p.last_seen DESC NULLS LAST
  LIMIT 50;  -- Limit to 50 most recently active users
  
  RETURN NEW;
END;
$$;

-- Create the trigger for forum posts
DROP TRIGGER IF EXISTS forum_post_notification_trigger ON public.forum_posts;
CREATE TRIGGER forum_post_notification_trigger
  AFTER INSERT ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_forum_post_created();