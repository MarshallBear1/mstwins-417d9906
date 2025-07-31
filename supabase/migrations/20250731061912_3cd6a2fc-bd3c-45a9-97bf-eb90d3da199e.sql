-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_remaining_likes_today();

-- Create referrals table to track referral links and bonuses
CREATE TABLE IF NOT EXISTS public.daily_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  referral_date DATE NOT NULL DEFAULT CURRENT_DATE,
  referral_code TEXT NOT NULL,
  bonus_claimed BOOLEAN NOT NULL DEFAULT false,
  bonus_claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, referral_date)
);

-- Enable RLS if not already enabled
ALTER TABLE public.daily_referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_referrals
DROP POLICY IF EXISTS "Users can manage their own daily referrals" ON public.daily_referrals;
CREATE POLICY "Users can manage their own daily referrals" 
ON public.daily_referrals 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create the new function with updated return type
CREATE OR REPLACE FUNCTION public.get_remaining_likes_today()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    current_likes INTEGER := 0;
    base_like_limit INTEGER := 5; -- Reduced from 10 to 5
    referral_bonus INTEGER := 5;
    enforcement_date DATE := '2025-07-24';
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
$$;

-- Create function to generate and track referral bonus
CREATE OR REPLACE FUNCTION public.claim_referral_bonus()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    current_user_id UUID := auth.uid();
    referral_code TEXT;
    existing_referral RECORD;
BEGIN
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Check if user already has a referral for today
    SELECT * INTO existing_referral
    FROM public.daily_referrals
    WHERE user_id = current_user_id AND referral_date = CURRENT_DATE;
    
    IF existing_referral.id IS NOT NULL THEN
        IF existing_referral.bonus_claimed THEN
            RETURN jsonb_build_object('success', false, 'error', 'Bonus already claimed today');
        ELSE
            -- Update existing referral to claim bonus
            UPDATE public.daily_referrals 
            SET bonus_claimed = true, bonus_claimed_at = now()
            WHERE id = existing_referral.id;
            
            RETURN jsonb_build_object(
                'success', true, 
                'referral_code', existing_referral.referral_code,
                'message', 'Bonus claimed! You now have 5 additional likes today.'
            );
        END IF;
    END IF;
    
    -- Generate new referral code (user_id + date hash)
    referral_code := substring(md5(current_user_id::text || CURRENT_DATE::text) from 1 for 8);
    
    -- Create new referral record with bonus claimed
    INSERT INTO public.daily_referrals (user_id, referral_date, referral_code, bonus_claimed, bonus_claimed_at)
    VALUES (current_user_id, CURRENT_DATE, referral_code, true, now());
    
    RETURN jsonb_build_object(
        'success', true, 
        'referral_code', referral_code,
        'message', 'Bonus claimed! You now have 5 additional likes today.'
    );
END;
$$;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_daily_referrals_updated_at ON public.daily_referrals;
CREATE TRIGGER update_daily_referrals_updated_at
BEFORE UPDATE ON public.daily_referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();