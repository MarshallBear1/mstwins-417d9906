-- Drop and recreate get_matching_profiles function to include last_seen field
DROP FUNCTION IF EXISTS public.get_matching_profiles(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_matching_profiles(
  requesting_user_id UUID,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  first_name TEXT,
  age INTEGER,
  city TEXT,
  gender TEXT,
  ms_subtype TEXT,
  avatar_url TEXT,
  about_me_preview TEXT,
  hobbies TEXT[],
  additional_photos TEXT[],
  selected_prompts JSONB,
  extended_profile_completed BOOLEAN,
  last_seen TIMESTAMP WITH TIME ZONE
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
    p.id,
    p.user_id,
    p.first_name,
    -- Calculate age from date_of_birth
    CASE 
      WHEN p.date_of_birth IS NOT NULL THEN 
        DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth))::integer
      ELSE NULL 
    END as age,
    -- Extract city from location (take everything before first comma)
    CASE 
      WHEN p.location IS NOT NULL THEN 
        TRIM(SPLIT_PART(p.location, ',', 1))
      ELSE NULL 
    END as city,
    p.gender,
    p.ms_subtype,
    p.avatar_url,
    -- Create a preview of about_me (first 200 characters)
    CASE 
      WHEN p.about_me IS NOT NULL AND LENGTH(p.about_me) > 200 THEN 
        SUBSTRING(p.about_me FROM 1 FOR 200) || '...'
      ELSE p.about_me 
    END as about_me_preview,
    p.hobbies,
    p.additional_photos,
    p.selected_prompts,
    p.extended_profile_completed,
    p.last_seen
  FROM public.profiles p
  WHERE 
    p.user_id != requesting_user_id  -- Exclude requesting user
    AND p.moderation_status = 'approved' 
    AND p.hide_from_discover = false
    AND p.first_name IS NOT NULL 
    AND p.first_name != ''
    AND p.user_id NOT IN (
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