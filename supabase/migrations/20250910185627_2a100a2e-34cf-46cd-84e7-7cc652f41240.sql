-- CRITICAL SECURITY FIXES
-- Fix 1: Restrict profile visibility to prevent privacy violations

-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "optimized_profile_visibility" ON public.profiles;

-- Create new restrictive policies for profiles
-- Users can only see their own full profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

-- Create a discovery view that only shows safe matching data
CREATE OR REPLACE VIEW public.profile_discovery AS
SELECT 
  p.id,
  p.user_id,
  p.first_name, -- Only first name for privacy
  CASE 
    WHEN p.date_of_birth IS NOT NULL 
    THEN EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER 
    ELSE NULL 
  END as age, -- Age instead of birth date
  SPLIT_PART(p.location, ',', 1) as city, -- Only city, not full address
  p.gender,
  p.ms_subtype,
  p.avatar_url,
  -- Truncated about_me for privacy (max 200 chars)
  CASE 
    WHEN LENGTH(p.about_me) > 200 
    THEN SUBSTRING(p.about_me FROM 1 FOR 200) || '...'
    ELSE p.about_me 
  END as about_me_preview,
  p.hobbies,
  p.additional_photos,
  p.selected_prompts,
  p.last_seen,
  p.hide_from_discover,
  p.extended_profile_completed
FROM public.profiles p
WHERE p.moderation_status = 'approved' 
  AND p.hide_from_discover = false
  AND auth.uid() IS NOT NULL
  AND p.user_id != auth.uid(); -- Don't show own profile in discovery

-- Grant access to the discovery view
GRANT SELECT ON public.profile_discovery TO authenticated;

-- Create RLS policy for the discovery view
ALTER VIEW public.profile_discovery SET (security_barrier = true);

-- Fix 2: Secure forum privacy - create anonymous author function
CREATE OR REPLACE FUNCTION public.get_forum_author_display(author_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  author_info jsonb;
BEGIN
  -- Only return author info if viewer is the author or an admin
  IF auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    SELECT jsonb_build_object(
      'id', p.user_id,
      'name', p.first_name,
      'avatar_url', p.avatar_url
    ) INTO author_info
    FROM public.profiles p
    WHERE p.user_id = author_id;
  ELSE
    -- Return anonymous info for privacy
    author_info := jsonb_build_object(
      'id', null,
      'name', 'Community Member',
      'avatar_url', null
    );
  END IF;
  
  RETURN COALESCE(author_info, jsonb_build_object('id', null, 'name', 'Anonymous', 'avatar_url', null));
END;
$$;

-- Fix 3: Update database functions to have secure search paths
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Added for security
AS $$
DECLARE
  is_mutual_like BOOLEAN := FALSE;
  existing_match_id UUID;
  liker_name TEXT;
  liked_name TEXT;
BEGIN
  -- Check if there's already a like from the liked user to the liker (mutual like)
  SELECT EXISTS (
    SELECT 1 FROM public.likes 
    WHERE liker_id = NEW.liked_id 
    AND liked_id = NEW.liker_id
  ) INTO is_mutual_like;

  IF is_mutual_like THEN
    -- Check if match already exists
    SELECT id INTO existing_match_id
    FROM public.matches 
    WHERE (user1_id = LEAST(NEW.liker_id, NEW.liked_id) AND user2_id = GREATEST(NEW.liker_id, NEW.liked_id));
    
    -- Only create match if it doesn't exist
    IF existing_match_id IS NULL THEN
      INSERT INTO public.matches (user1_id, user2_id)
      VALUES (
        LEAST(NEW.liker_id, NEW.liked_id),
        GREATEST(NEW.liker_id, NEW.liked_id)
      );
      
      -- Get user names for notifications (only first names for privacy)
      SELECT first_name INTO liker_name FROM public.profiles WHERE user_id = NEW.liker_id;
      SELECT first_name INTO liked_name FROM public.profiles WHERE user_id = NEW.liked_id;
      
      -- Create notifications for both users with enhanced duplicate prevention (5 minute window)
      INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
      SELECT NEW.liker_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liked_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE user_id = NEW.liker_id 
        AND type = 'match' 
        AND from_user_id = NEW.liked_id 
        AND created_at > NOW() - INTERVAL '5 minutes'
      );
      
      INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
      SELECT NEW.liked_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liker_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE user_id = NEW.liked_id 
        AND type = 'match' 
        AND from_user_id = NEW.liker_id 
        AND created_at > NOW() - INTERVAL '5 minutes'
      );

      -- Queue match email with enhanced duplicate prevention
      INSERT INTO public.email_queue (type, liker_user_id, liked_user_id)
      SELECT 'match', NEW.liker_id, NEW.liked_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.email_queue 
        WHERE type = 'match' 
        AND ((liker_user_id = NEW.liker_id AND liked_user_id = NEW.liked_id) 
             OR (liker_user_id = NEW.liked_id AND liked_user_id = NEW.liker_id))
        AND created_at > NOW() - INTERVAL '5 minutes'
      );
    END IF;
    
  ELSE
    -- Get liker name for like notification (only first name)
    SELECT first_name INTO liker_name FROM public.profiles WHERE user_id = NEW.liker_id;
    
    -- Create a like notification with enhanced duplicate prevention (2 minute window)
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    SELECT NEW.liked_id, 'like', 'Someone liked you!', 'You have a new like! Check it out.', NEW.liker_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = NEW.liked_id 
      AND type = 'like' 
      AND from_user_id = NEW.liker_id 
      AND created_at > NOW() - INTERVAL '2 minutes'
    );

    -- Queue like email with enhanced duplicate prevention
    INSERT INTO public.email_queue (type, liker_user_id, liked_user_id)
    SELECT 'like', NEW.liker_id, NEW.liked_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.email_queue 
      WHERE type = 'like' 
      AND liker_user_id = NEW.liker_id 
      AND liked_user_id = NEW.liked_id 
      AND created_at > NOW() - INTERVAL '2 minutes'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix 4: Create secure profile matching function
CREATE OR REPLACE FUNCTION public.get_matching_profiles(requesting_user_id uuid, limit_count integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  first_name text,
  age integer,
  city text,
  gender text,
  ms_subtype text,
  avatar_url text,
  about_me_preview text,
  hobbies text[],
  additional_photos text[],
  selected_prompts jsonb,
  extended_profile_completed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to get profiles for themselves
  IF requesting_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Can only get profiles for authenticated user';
  END IF;

  RETURN QUERY
  SELECT 
    pd.id,
    pd.user_id,
    pd.first_name,
    pd.age,
    pd.city,
    pd.gender,
    pd.ms_subtype,
    pd.avatar_url,
    pd.about_me_preview,
    pd.hobbies,
    pd.additional_photos,
    pd.selected_prompts,
    pd.extended_profile_completed
  FROM public.profile_discovery pd
  WHERE pd.user_id NOT IN (
    -- Exclude users already liked
    SELECT liked_id FROM public.likes WHERE liker_id = requesting_user_id
    UNION
    -- Exclude users already passed
    SELECT passed_id FROM public.passes WHERE passer_id = requesting_user_id
  )
  ORDER BY RANDOM()
  LIMIT limit_count;
END;
$$;

-- Fix 5: Update enhanced profile trigger with better security
CREATE OR REPLACE FUNCTION public.enhanced_profile_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to modify their own profiles
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Can only modify own profile';
  END IF;

  -- Validate and sanitize text inputs
  NEW.first_name := public.validate_text_input(NEW.first_name, 50);
  NEW.last_name := public.validate_text_input(NEW.last_name, 50);
  NEW.about_me := public.validate_text_input(NEW.about_me, 1000);
  NEW.location := public.validate_text_input(NEW.location, 100);
  NEW.ms_subtype := public.validate_text_input(NEW.ms_subtype, 50);
  
  -- Validate required fields
  IF NEW.first_name IS NULL OR trim(NEW.first_name) = '' THEN
    RAISE EXCEPTION 'First name is required';
  END IF;
  
  IF NEW.last_name IS NULL OR trim(NEW.last_name) = '' THEN
    RAISE EXCEPTION 'Last name is required';
  END IF;
  
  IF NEW.location IS NULL OR trim(NEW.location) = '' THEN
    RAISE EXCEPTION 'Location is required';
  END IF;
  
  -- Validate age (must be 18+)
  IF NEW.date_of_birth IS NOT NULL AND NEW.date_of_birth > CURRENT_DATE - INTERVAL '18 years' THEN
    RAISE EXCEPTION 'Users must be at least 18 years old';
  END IF;
  
  -- Validate diagnosis year
  IF NEW.diagnosis_year IS NOT NULL AND (NEW.diagnosis_year < 1950 OR NEW.diagnosis_year > EXTRACT(YEAR FROM CURRENT_DATE)) THEN
    RAISE EXCEPTION 'Invalid diagnosis year';
  END IF;
  
  -- Log profile updates
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(NEW.user_id, 'profile_updated', jsonb_build_object('fields_updated', array_length(string_to_array(TG_ARGV[0], ','), 1)));
  ELSE
    PERFORM public.log_security_event(NEW.user_id, 'profile_created', '{}'::jsonb);
  END IF;
  
  RETURN NEW;
END;
$$;