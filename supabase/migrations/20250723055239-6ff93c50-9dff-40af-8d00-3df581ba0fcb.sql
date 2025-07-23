-- Fix the get_remaining_likes_today function to properly handle when no likes have been used today
CREATE OR REPLACE FUNCTION public.get_remaining_likes_today()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    current_likes INTEGER;
    like_limit INTEGER := 10;
    enforcement_date DATE := '2025-07-23';
    current_user_id UUID := auth.uid();
BEGIN
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Before enforcement date, return unlimited (represented as 999)
    IF CURRENT_DATE < enforcement_date THEN
        RETURN 999;
    END IF;
    
    -- Get current like count for today, default to 0 if no record exists
    SELECT COALESCE(like_count, 0) INTO current_likes
    FROM public.daily_likes
    WHERE user_id = current_user_id AND like_date = CURRENT_DATE;
    
    -- If no record found, user hasn't liked anyone today, so return full limit
    IF current_likes IS NULL THEN
        current_likes := 0;
    END IF;
    
    RETURN GREATEST(0, like_limit - current_likes);
END;
$$;

-- Fix the check_and_increment_daily_likes function to properly handle the first like of the day
CREATE OR REPLACE FUNCTION public.check_and_increment_daily_likes(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    current_likes INTEGER;
    like_limit INTEGER := 10;
    enforcement_date DATE := '2025-07-23';
    current_user_id UUID := auth.uid();
BEGIN
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Before enforcement date, allow unlimited likes for existing behavior
    IF CURRENT_DATE < enforcement_date THEN
        -- Still track for future reference but don't enforce limit
        INSERT INTO public.daily_likes (user_id, like_date, like_count)
        VALUES (current_user_id, CURRENT_DATE, 1)
        ON CONFLICT (user_id, like_date)
        DO UPDATE SET 
            like_count = daily_likes.like_count + 1,
            updated_at = now();
        RETURN TRUE;
    END IF;
    
    -- Get current like count for today, default to 0 if no record exists
    SELECT COALESCE(like_count, 0) INTO current_likes
    FROM public.daily_likes
    WHERE user_id = current_user_id AND like_date = CURRENT_DATE;
    
    -- If no record found, this is the first like of the day
    IF current_likes IS NULL THEN
        current_likes := 0;
    END IF;
    
    -- Check if user has reached daily limit
    IF current_likes >= like_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Increment like count
    INSERT INTO public.daily_likes (user_id, like_date, like_count)
    VALUES (current_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, like_date)
    DO UPDATE SET 
        like_count = daily_likes.like_count + 1,
        updated_at = now();
    
    RETURN TRUE;
END;
$$;

-- Create function to get users who need like refresh notification emails
CREATE OR REPLACE FUNCTION public.get_users_needing_like_refresh_emails()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_like_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  -- Users who used all 10 likes yesterday but haven't been notified about today's refresh
  SELECT 
    dl.user_id,
    au.email,
    p.first_name,
    dl.like_date as last_like_date
  FROM public.daily_likes dl
  JOIN auth.users au ON dl.user_id = au.id
  JOIN public.profiles p ON dl.user_id = p.user_id
  WHERE dl.like_date = CURRENT_DATE - INTERVAL '1 day'
    AND dl.like_count >= 10
    AND NOT EXISTS (
      SELECT 1 FROM public.re_engagement_emails ree 
      WHERE ree.user_id = dl.user_id 
      AND ree.email_type = 'likes_refreshed'
      AND ree.sent_at::date = CURRENT_DATE
    );
END;
$$;

-- Add likes_refreshed email type to re_engagement_emails table
ALTER TABLE public.re_engagement_emails 
DROP CONSTRAINT IF EXISTS re_engagement_emails_email_type_check;

ALTER TABLE public.re_engagement_emails 
ADD CONSTRAINT re_engagement_emails_email_type_check 
CHECK (email_type IN ('24_hours', '48_hours', '1_week', 'likes_refreshed'));