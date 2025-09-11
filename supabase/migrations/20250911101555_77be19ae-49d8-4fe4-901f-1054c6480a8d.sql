-- Fix the profile_discovery view to include all necessary data
DROP VIEW IF EXISTS public.profile_discovery;

CREATE VIEW public.profile_discovery AS
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
  p.hide_from_discover,
  p.last_seen
FROM public.profiles p
WHERE 
  p.moderation_status = 'approved' 
  AND p.hide_from_discover = false
  AND p.first_name IS NOT NULL 
  AND p.first_name != '';

-- Add comment explaining the view
COMMENT ON VIEW public.profile_discovery IS 'Secure view for profile discovery that only exposes safe, non-sensitive profile data for matching purposes';