-- Fix the enforcement date in both functions to ensure like limits are properly enforced
-- The current date is 2025-07-31, so enforcement should be active

CREATE OR REPLACE FUNCTION public.check_and_increment_daily_likes(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    current_likes INTEGER;
    like_limit INTEGER := 5;
    enforcement_date DATE := '2025-07-25'; -- Updated to ensure enforcement is active
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
$function$;

CREATE OR REPLACE FUNCTION public.get_remaining_likes_today()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    current_likes INTEGER := 0;
    base_like_limit INTEGER := 5;
    referral_bonus INTEGER := 5;
    enforcement_date DATE := '2025-07-25'; -- Updated to ensure enforcement is active
    current_user_id UUID := auth.uid();
    has_referral_bonus BOOLEAN := false;
    total_limit INTEGER;
BEGIN
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'remaining', 999,
            'total_limit', 999,
            'base_limit', base_like_limit,
            'has_bonus', false,
            'can_get_bonus', false
        );
    END IF;
    
    -- Before enforcement date, return unlimited (represented as 999)
    IF CURRENT_DATE < enforcement_date THEN
        RETURN jsonb_build_object(
            'remaining', 999,
            'total_limit', 999,
            'base_limit', base_like_limit,
            'has_bonus', false,
            'can_get_bonus', false
        );
    END IF;
    
    -- Check if user has referral bonus for today
    SELECT bonus_claimed INTO has_referral_bonus
    FROM public.daily_referrals
    WHERE user_id = current_user_id AND referral_date = CURRENT_DATE;
    
    IF has_referral_bonus IS NULL THEN
        has_referral_bonus := false;
    END IF;
    
    -- Calculate total limit
    total_limit := base_like_limit;
    IF has_referral_bonus THEN
        total_limit := total_limit + referral_bonus;
    END IF;
    
    -- Get current like count for today
    SELECT like_count INTO current_likes
    FROM public.daily_likes
    WHERE user_id = current_user_id AND like_date = CURRENT_DATE;
    
    -- If no record found (user hasn't liked anyone today), set to 0
    IF current_likes IS NULL THEN
        current_likes := 0;
    END IF;
    
    -- Return detailed information
    RETURN jsonb_build_object(
        'remaining', GREATEST(0, total_limit - current_likes),
        'total_limit', total_limit,
        'base_limit', base_like_limit,
        'has_bonus', has_referral_bonus,
        'can_get_bonus', (NOT has_referral_bonus AND current_likes >= base_like_limit),
        'used_likes', current_likes
    );
END;
$function$;