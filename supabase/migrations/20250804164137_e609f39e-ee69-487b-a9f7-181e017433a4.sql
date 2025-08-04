-- Update the function to always return unlimited likes and always allow likes
CREATE OR REPLACE FUNCTION public.check_and_increment_daily_likes(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Always allow likes - no limits enforced
    -- Still track usage for analytics but don't enforce limits
    INSERT INTO public.daily_likes (user_id, like_date, like_count)
    VALUES (current_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, like_date)
    DO UPDATE SET 
        like_count = daily_likes.like_count + 1,
        updated_at = now();
        
    RETURN TRUE;
END;
$function$;

-- Update the function to always return unlimited likes
CREATE OR REPLACE FUNCTION public.get_remaining_likes_today()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    current_user_id UUID := auth.uid();
    used_today INTEGER := 0;
BEGIN
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'remaining', 999,
            'total_limit', 999,
            'base_limit', 999,
            'has_bonus', false,
            'can_get_bonus', false,
            'used_likes', 0
        );
    END IF;
    
    -- Get today's usage for analytics
    SELECT COALESCE(like_count, 0) INTO used_today
    FROM public.daily_likes
    WHERE user_id = current_user_id AND like_date = CURRENT_DATE;
    
    -- Always return unlimited likes
    RETURN jsonb_build_object(
        'remaining', 999,
        'total_limit', 999,
        'base_limit', 999,
        'has_bonus', false,
        'can_get_bonus', false,
        'used_likes', used_today
    );
END;
$function$;