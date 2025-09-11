-- Update the get_matching_profiles function to include last_seen field
-- for showing "last online" instead of "member"

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
  extended_profile_completed boolean,
  last_seen timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    AND p.user_id NOT IN (
      -- Exclude users already liked
      SELECT liked_id FROM public.likes WHERE liker_id = requesting_user_id
      UNION
      -- Exclude users already passed
      SELECT passed_id FROM public.passes WHERE passer_id = requesting_user_id
    )
    -- Only show approved profiles that are not hidden
    AND (p.moderation_status IS NULL OR p.moderation_status = 'approved')
    AND (p.hide_from_discover IS NULL OR p.hide_from_discover = false)
  ORDER BY RANDOM()
  LIMIT limit_count;
END;
$function$;
