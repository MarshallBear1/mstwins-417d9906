-- Update the daily likes limit from 5 to 10
CREATE OR REPLACE FUNCTION public.check_and_increment_daily_likes(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    current_likes INTEGER;
    base_limit INTEGER := 10; -- Changed from 5 to 10
    bonus_limit INTEGER := 5;
    total_limit INTEGER;
    has_bonus BOOLEAN := false;
    enforcement_date DATE := '2025-01-01';
    current_user_id UUID := auth.uid();
BEGIN
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Before enforcement date, allow unlimited likes but still track
    IF CURRENT_DATE < enforcement_date THEN
        INSERT INTO public.daily_likes (user_id, like_date, like_count)
        VALUES (current_user_id, CURRENT_DATE, 1)
        ON CONFLICT (user_id, like_date)
        DO UPDATE SET 
            like_count = daily_likes.like_count + 1,
            updated_at = now();
        RETURN TRUE;
    END IF;
    
    -- Get current like count for today
    SELECT COALESCE(like_count, 0) INTO current_likes
    FROM public.daily_likes
    WHERE user_id = current_user_id AND like_date = CURRENT_DATE;
    
    -- Set default if null
    IF current_likes IS NULL THEN
        current_likes := 0;
    END IF;
    
    -- Check if user has referral bonus for today
    SELECT EXISTS (
        SELECT 1 FROM public.daily_referrals 
        WHERE user_id = current_user_id 
        AND referral_date = CURRENT_DATE 
        AND bonus_claimed = true
    ) INTO has_bonus;
    
    -- Calculate total limit
    total_limit := base_limit;
    IF has_bonus THEN
        total_limit := total_limit + bonus_limit;
    END IF;
    
    -- Check if limit reached
    IF current_likes >= total_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Increment like count
    INSERT INTO public.daily_likes (user_id, like_date, like_count)
    VALUES (current_user_id, CURRENT_DATE, current_likes + 1)
    ON CONFLICT (user_id, like_date)
    DO UPDATE SET 
        like_count = daily_likes.like_count + 1,
        updated_at = now();
    
    RETURN TRUE;
END;
$function$;