-- Update the get_remaining_likes_today function to use the new 10 like base limit
CREATE OR REPLACE FUNCTION public.get_remaining_likes_today()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    current_user_id UUID := auth.uid();
    current_likes INTEGER := 0;
    base_limit INTEGER := 10; -- Changed from 5 to 10
    bonus_limit INTEGER := 5;
    total_limit INTEGER;
    has_bonus BOOLEAN := false;
    can_get_bonus BOOLEAN := false;
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
    
    -- Before enforcement date, return unlimited
    IF CURRENT_DATE < enforcement_date THEN
        -- Get current usage for display purposes
        SELECT COALESCE(like_count, 0) INTO current_likes
        FROM public.daily_likes
        WHERE user_id = current_user_id AND like_date = CURRENT_DATE;
        
        RETURN jsonb_build_object(
            'remaining', 999,
            'total_limit', 999,
            'base_limit', base_limit,
            'has_bonus', false,
            'can_get_bonus', true,
            'used_likes', current_likes
        );
    END IF;
    
    -- Get current like count for today
    SELECT COALESCE(like_count, 0) INTO current_likes
    FROM public.daily_likes
    WHERE user_id = current_user_id AND like_date = CURRENT_DATE;
    
    -- Check if user has referral bonus for today
    SELECT EXISTS (
        SELECT 1 FROM public.daily_referrals 
        WHERE user_id = current_user_id 
        AND referral_date = CURRENT_DATE 
        AND bonus_claimed = true
    ) INTO has_bonus;
    
    -- Check if user can get bonus (hasn't claimed it yet today)
    SELECT NOT EXISTS (
        SELECT 1 FROM public.daily_referrals 
        WHERE user_id = current_user_id 
        AND referral_date = CURRENT_DATE 
        AND bonus_claimed = true
    ) INTO can_get_bonus;
    
    -- Calculate total limit
    total_limit := base_limit;
    IF has_bonus THEN
        total_limit := total_limit + bonus_limit;
    END IF;
    
    RETURN jsonb_build_object(
        'remaining', GREATEST(0, total_limit - current_likes),
        'total_limit', total_limit,
        'base_limit', base_limit,
        'has_bonus', has_bonus,
        'can_get_bonus', can_get_bonus,
        'used_likes', current_likes
    );
END;
$function$;