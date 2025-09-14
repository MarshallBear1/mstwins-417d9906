-- Update get_matching_profiles function to prioritize recently active users
-- This will show 6-7 out of 10 profiles being recently active (within last few days)

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
  WITH base_profiles AS (
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
      p.last_seen,
      -- Calculate activity score: recently active users get higher score
      CASE 
        WHEN p.last_seen IS NULL THEN 0.1
        WHEN p.last_seen > NOW() - INTERVAL '1 day' THEN 10.0
        WHEN p.last_seen > NOW() - INTERVAL '3 days' THEN 8.0
        WHEN p.last_seen > NOW() - INTERVAL '7 days' THEN 6.0
        WHEN p.last_seen > NOW() - INTERVAL '14 days' THEN 4.0
        WHEN p.last_seen > NOW() - INTERVAL '30 days' THEN 2.0
        ELSE 1.0
      END as activity_score
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
  ),
  recent_active AS (
    -- Get recently active profiles (within 3 days) - aim for about 70% of results
    SELECT *, RANDOM() * activity_score as weighted_random
    FROM base_profiles 
    WHERE activity_score >= 6.0
    ORDER BY weighted_random DESC
    LIMIT GREATEST(1, (limit_count * 7 / 10)::INTEGER)
  ),
  other_profiles AS (
    -- Get remaining profiles to fill up the limit
    SELECT *, RANDOM() as weighted_random
    FROM base_profiles 
    WHERE user_id NOT IN (SELECT user_id FROM recent_active)
    ORDER BY weighted_random DESC
    LIMIT GREATEST(1, limit_count - (SELECT COUNT(*) FROM recent_active)::INTEGER)
  )
  -- Combine and shuffle the final results
  SELECT 
    bp.id, bp.user_id, bp.first_name, bp.age, bp.city, bp.gender, 
    bp.ms_subtype, bp.avatar_url, bp.about_me_preview, bp.hobbies, 
    bp.additional_photos, bp.selected_prompts, bp.extended_profile_completed, bp.last_seen
  FROM (
    SELECT * FROM recent_active
    UNION ALL
    SELECT * FROM other_profiles
  ) bp
  ORDER BY RANDOM()
  LIMIT limit_count;
END;
$$;