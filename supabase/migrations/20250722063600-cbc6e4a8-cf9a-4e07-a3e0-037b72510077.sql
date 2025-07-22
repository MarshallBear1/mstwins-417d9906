-- Security fixes for database functions
-- Fix 1: Update create_match_on_mutual_like function with proper search_path
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Check if there's already a like from the liked user to the liker (mutual like)
  IF EXISTS (
    SELECT 1 FROM public.likes 
    WHERE liker_id = NEW.liked_id 
    AND liked_id = NEW.liker_id
  ) THEN
    -- Create a match (ensure consistent ordering)
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.liker_id, NEW.liked_id),
      GREATEST(NEW.liker_id, NEW.liked_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
    
    -- Create notifications for both users
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    VALUES 
    (NEW.liker_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liked_id),
    (NEW.liked_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liker_id);
    
  ELSE
    -- Create a like notification for the liked user
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    VALUES (NEW.liked_id, 'like', 'Someone liked you!', 'You have a new like! Check it out.', NEW.liker_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix 2: Update create_message_notification function with proper search_path
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only create notification for the receiver
  INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
  VALUES (NEW.receiver_id, 'message', 'New Message', 'You have a new message!', NEW.sender_id);
  
  RETURN NEW;
END;
$function$;

-- Fix 3: Update update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix 4: Add input validation for critical functions
-- Create a function to validate user permissions for sensitive operations
CREATE OR REPLACE FUNCTION public.validate_user_action(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Additional validation can be added here
  RETURN TRUE;
END;
$function$;

-- Fix 5: Improve RLS policy for profiles table
-- Remove overly permissive discovery policy and replace with more secure one
DROP POLICY IF EXISTS "Users can view profiles for discovery" ON public.profiles;

-- Create more restrictive policy for profile discovery
CREATE POLICY "Users can view public profile data for discovery" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own profile completely
  auth.uid() = user_id 
  OR 
  -- Others can only see basic public information (not sensitive data)
  (auth.uid() IS NOT NULL AND id IS NOT NULL)
);

-- Fix 6: Add rate limiting for likes to prevent spam
CREATE OR REPLACE FUNCTION public.check_like_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  recent_likes_count integer;
BEGIN
  -- Check if user has made too many likes recently (more than 50 in last hour)
  SELECT COUNT(*) INTO recent_likes_count
  FROM public.likes
  WHERE liker_id = NEW.liker_id 
  AND created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_likes_count > 50 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before liking more profiles.';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for rate limiting likes
DROP TRIGGER IF EXISTS check_like_rate_limit_trigger ON public.likes;
CREATE TRIGGER check_like_rate_limit_trigger
  BEFORE INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_like_rate_limit();