-- Create table to track re-engagement emails sent to users
CREATE TABLE IF NOT EXISTS public.re_engagement_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('24_hours', '48_hours', '1_week')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, email_type)
);

-- Enable RLS
ALTER TABLE public.re_engagement_emails ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (system-only access for re-engagement tracking)
CREATE POLICY "System can manage re-engagement emails" 
ON public.re_engagement_emails 
FOR ALL 
USING (true);

-- Create function to get users who need re-engagement emails
CREATE OR REPLACE FUNCTION public.get_users_needing_re_engagement()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  hours_offline INTEGER,
  email_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  WITH user_offline_data AS (
    SELECT 
      p.user_id,
      au.email,
      p.first_name,
      p.last_seen,
      EXTRACT(EPOCH FROM (NOW() - p.last_seen)) / 3600 AS hours_offline
    FROM public.profiles p
    JOIN auth.users au ON p.user_id = au.id
    WHERE p.last_seen IS NOT NULL
      AND p.last_seen < NOW() - INTERVAL '24 hours'
  )
  -- Users offline for 24+ hours who haven't received 24h email
  SELECT 
    uod.user_id,
    uod.email,
    uod.first_name,
    uod.last_seen,
    uod.hours_offline::INTEGER,
    '24_hours'::TEXT as email_type
  FROM user_offline_data uod
  WHERE uod.hours_offline >= 24 AND uod.hours_offline < 48
    AND NOT EXISTS (
      SELECT 1 FROM public.re_engagement_emails ree 
      WHERE ree.user_id = uod.user_id AND ree.email_type = '24_hours'
    )
  
  UNION ALL
  
  -- Users offline for 48+ hours who haven't received 48h email
  SELECT 
    uod.user_id,
    uod.email,
    uod.first_name,
    uod.last_seen,
    uod.hours_offline::INTEGER,
    '48_hours'::TEXT as email_type
  FROM user_offline_data uod
  WHERE uod.hours_offline >= 48 AND uod.hours_offline < 168
    AND NOT EXISTS (
      SELECT 1 FROM public.re_engagement_emails ree 
      WHERE ree.user_id = uod.user_id AND ree.email_type = '48_hours'
    )
  
  UNION ALL
  
  -- Users offline for 1+ week who haven't received 1week email
  SELECT 
    uod.user_id,
    uod.email,
    uod.first_name,
    uod.last_seen,
    uod.hours_offline::INTEGER,
    '1_week'::TEXT as email_type
  FROM user_offline_data uod
  WHERE uod.hours_offline >= 168
    AND NOT EXISTS (
      SELECT 1 FROM public.re_engagement_emails ree 
      WHERE ree.user_id = uod.user_id AND ree.email_type = '1_week'
    );
END;
$$;