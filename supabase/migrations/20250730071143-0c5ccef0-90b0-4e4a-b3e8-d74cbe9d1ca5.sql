-- Drop triggers first, then functions, then recreate with proper search_path
DROP TRIGGER IF EXISTS forum_post_like_count_trigger ON public.forum_likes;
DROP TRIGGER IF EXISTS forum_post_comment_count_trigger ON public.forum_comments;
DROP TRIGGER IF EXISTS forum_comment_like_count_trigger ON public.forum_comment_likes;

DROP FUNCTION IF EXISTS public.update_forum_post_like_count();
DROP FUNCTION IF EXISTS public.update_forum_post_comment_count();
DROP FUNCTION IF EXISTS public.update_forum_comment_like_count();

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_forum_post_like_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_forum_post_comment_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts 
    SET comments_count = GREATEST(0, comments_count - 1) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_forum_comment_like_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_comments 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Recreate triggers
CREATE TRIGGER forum_post_like_count_trigger
  AFTER INSERT OR DELETE ON public.forum_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_forum_post_like_count();

CREATE TRIGGER forum_post_comment_count_trigger
  AFTER INSERT OR DELETE ON public.forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_forum_post_comment_count();

CREATE TRIGGER forum_comment_like_count_trigger
  AFTER INSERT OR DELETE ON public.forum_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_forum_comment_like_count();