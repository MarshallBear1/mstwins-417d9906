-- Fix ambiguous column references in get_matching_profiles function
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
        SELECT l.liked_id FROM public.likes l WHERE l.liker_id = requesting_user_id
        UNION
        -- Exclude users already passed
        SELECT ps.passed_id FROM public.passes ps WHERE ps.passer_id = requesting_user_id
      )
  ),
  recent_active AS (
    -- Get recently active profiles (within 3 days) - aim for about 70% of results
    SELECT bp.*, RANDOM() * bp.activity_score as weighted_random
    FROM base_profiles bp
    WHERE bp.activity_score >= 6.0
    ORDER BY weighted_random DESC
    LIMIT GREATEST(1, (limit_count * 7 / 10)::INTEGER)
  ),
  other_profiles AS (
    -- Get remaining profiles to fill up the limit
    SELECT bp.*, RANDOM() as weighted_random
    FROM base_profiles bp
    WHERE bp.user_id NOT IN (SELECT ra.user_id FROM recent_active ra)
    ORDER BY weighted_random DESC
    LIMIT GREATEST(1, limit_count - (SELECT COUNT(*) FROM recent_active)::INTEGER)
  )
  -- Combine and shuffle the final results
  SELECT 
    combined.id, 
    combined.user_id, 
    combined.first_name, 
    combined.age, 
    combined.city, 
    combined.gender, 
    combined.ms_subtype, 
    combined.avatar_url, 
    combined.about_me_preview, 
    combined.hobbies, 
    combined.additional_photos, 
    combined.selected_prompts, 
    combined.extended_profile_completed, 
    combined.last_seen
  FROM (
    SELECT ra.id, ra.user_id, ra.first_name, ra.age, ra.city, ra.gender, 
           ra.ms_subtype, ra.avatar_url, ra.about_me_preview, ra.hobbies, 
           ra.additional_photos, ra.selected_prompts, ra.extended_profile_completed, ra.last_seen
    FROM recent_active ra
    UNION ALL
    SELECT op.id, op.user_id, op.first_name, op.age, op.city, op.gender, 
           op.ms_subtype, op.avatar_url, op.about_me_preview, op.hobbies, 
           op.additional_photos, op.selected_prompts, op.extended_profile_completed, op.last_seen
    FROM other_profiles op
  ) combined
  ORDER BY RANDOM()
  LIMIT limit_count;
END;
$$;