-- Create a function to get user email for profile filtering
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id_param;
  
  RETURN user_email;
END;
$$;

-- Add index for better performance on profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_moderation ON public.profiles(user_id, moderation_status, hide_from_discover);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen DESC);