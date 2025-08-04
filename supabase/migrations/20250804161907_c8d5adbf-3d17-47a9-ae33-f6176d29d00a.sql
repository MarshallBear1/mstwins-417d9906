-- Fix the get_users_needing_like_refresh_emails function to resolve the type mismatch
CREATE OR REPLACE FUNCTION public.get_users_needing_like_refresh_emails()
 RETURNS TABLE(user_id uuid, email text, first_name text, last_like_date date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  -- Users who used all 10 likes yesterday but haven't been notified about today's refresh
  SELECT 
    dl.user_id,
    au.email::text, -- Explicit cast to text to fix type mismatch
    p.first_name::text, -- Explicit cast to text to fix type mismatch
    dl.like_date as last_like_date
  FROM public.daily_likes dl
  JOIN auth.users au ON dl.user_id = au.id
  JOIN public.profiles p ON dl.user_id = p.user_id
  WHERE dl.like_date = CURRENT_DATE - INTERVAL '1 day'
    AND dl.like_count >= 10
    AND NOT EXISTS (
      SELECT 1 FROM public.re_engagement_emails ree 
      WHERE ree.user_id = dl.user_id 
      AND ree.email_type = 'likes_refreshed'
      AND ree.sent_at::date = CURRENT_DATE
    );
END;
$function$;