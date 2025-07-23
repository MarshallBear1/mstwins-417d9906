-- Final fix for daily likes system - postpone enforcement to give users a grace period
CREATE OR REPLACE FUNCTION public.get_remaining_likes_today()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    current_likes INTEGER := 0;
    like_limit INTEGER := 10;
    enforcement_date DATE := '2025-07-24'; -- Give users one more day
    current_user_id UUID := auth.uid();
BEGIN
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN 999; -- Return unlimited for unauthenticated users (shouldn't happen in normal flow)
    END IF;
    
    -- Before enforcement date, return unlimited (represented as 999)
    IF CURRENT_DATE < enforcement_date THEN
        RETURN 999;
    END IF;
    
    -- Get current like count for today
    SELECT like_count INTO current_likes
    FROM public.daily_likes
    WHERE user_id = current_user_id AND like_date = CURRENT_DATE;
    
    -- If no record found (user hasn't liked anyone today), set to 0
    IF current_likes IS NULL THEN
        current_likes := 0;
    END IF;
    
    -- Return remaining likes (limit minus used likes)
    RETURN GREATEST(0, like_limit - current_likes);
END;
$$;

-- Update the increment function too
CREATE OR REPLACE FUNCTION public.check_and_increment_daily_likes(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    current_likes INTEGER;
    like_limit INTEGER := 10;
    enforcement_date DATE := '2025-07-24'; -- Give users one more day
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