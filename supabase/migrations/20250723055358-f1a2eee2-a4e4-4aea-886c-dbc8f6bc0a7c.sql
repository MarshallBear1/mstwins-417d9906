-- Debug and fix the get_remaining_likes_today function
CREATE OR REPLACE FUNCTION public.get_remaining_likes_today()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    current_likes INTEGER := 0;
    like_limit INTEGER := 10;
    enforcement_date DATE := '2025-07-23';
    current_user_id UUID := auth.uid();
    like_record RECORD;
BEGIN
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN 0;
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

-- Clean up any test records that may have been created
CREATE OR REPLACE FUNCTION public.reset_daily_likes_for_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    DELETE FROM public.daily_likes 
    WHERE user_id = auth.uid() AND like_date = CURRENT_DATE;
END;
$$;