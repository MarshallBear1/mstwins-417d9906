-- First, let's check what triggers exist and potentially remove duplicate ones
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_schema = 'public' AND event_object_table = 'likes';

-- Drop any existing duplicate triggers
DROP TRIGGER IF EXISTS create_match_on_mutual_like_trigger ON public.likes;
DROP TRIGGER IF EXISTS create_like_notification_trigger ON public.likes;
DROP TRIGGER IF EXISTS check_like_rate_limit_trigger ON public.likes;

-- Create a single comprehensive trigger for likes
CREATE TRIGGER create_match_on_mutual_like_trigger
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_on_mutual_like();

-- Create rate limit trigger
CREATE TRIGGER check_like_rate_limit_trigger
  BEFORE INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_like_rate_limit();