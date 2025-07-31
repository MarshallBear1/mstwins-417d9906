-- Fix daily likes system - ensure consistent like limits and enforcement
-- Step 1: Create/update the get_remaining_likes_today function to return consistent JSONB
CREATE OR REPLACE FUNCTION public.get_remaining_likes_today()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    current_user_id UUID := auth.uid();
    base_limit INTEGER := 5;
    bonus_limit INTEGER := 5;
    current_likes INTEGER := 0;
    has_bonus BOOLEAN := false;
    can_get_bonus BOOLEAN := false;
    total_limit INTEGER;
    remaining_likes INTEGER;
    enforcement_date DATE := '2025-01-01';
BEGIN
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'remaining', 999,
            'total_limit', 999,
            'base_limit', base_limit,
            'has_bonus', false,
            'can_get_bonus', false,
            'used_likes', 0
        );
    END IF;
    
    -- Before enforcement date, return unlimited likes (legacy behavior)
    IF CURRENT_DATE < enforcement_date THEN
        RETURN jsonb_build_object(
            'remaining', 999,
            'total_limit', 999,
            'base_limit', base_limit,
            'has_bonus', false,
            'can_get_bonus', false,
            'used_likes', 0
        );
    END IF;
    
    -- Get current like count for today
    SELECT COALESCE(like_count, 0) INTO current_likes
    FROM public.daily_likes
    WHERE user_id = current_user_id AND like_date = CURRENT_DATE;
    
    -- Check if user has referral bonus for today
    SELECT COALESCE(bonus_claimed, false) INTO has_bonus
    FROM public.daily_referrals
    WHERE user_id = current_user_id AND referral_date = CURRENT_DATE;
    
    -- Check if user can get bonus (has not claimed today)
    can_get_bonus := NOT has_bonus;
    
    -- Calculate total limit
    total_limit := base_limit;
    IF has_bonus THEN
        total_limit := total_limit + bonus_limit;
    END IF;
    
    -- Calculate remaining likes
    remaining_likes := GREATEST(0, total_limit - current_likes);
    
    RETURN jsonb_build_object(
        'remaining', remaining_likes,
        'total_limit', total_limit,
        'base_limit', base_limit,
        'has_bonus', has_bonus,
        'can_get_bonus', can_get_bonus,
        'used_likes', current_likes
    );
END;
$function$;

-- Step 2: Update check_and_increment_daily_likes function for consistency
CREATE OR REPLACE FUNCTION public.check_and_increment_daily_likes(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    current_likes INTEGER;
    base_limit INTEGER := 5;
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
    
    -- Check if user has referral bonus for today
    SELECT COALESCE(bonus_claimed, false) INTO has_bonus
    FROM public.daily_referrals
    WHERE user_id = current_user_id AND referral_date = CURRENT_DATE;
    
    -- Calculate total limit
    total_limit := base_limit;
    IF has_bonus THEN
        total_limit := total_limit + bonus_limit;
    END IF;
    
    -- Check if user has reached daily limit
    IF current_likes >= total_limit THEN
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