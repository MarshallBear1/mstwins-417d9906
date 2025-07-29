-- First, ensure we have proper admin role setup and create secure admin authentication functions

-- Create a more secure admin authentication function that validates real user sessions
CREATE OR REPLACE FUNCTION public.authenticate_admin_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  user_is_admin BOOLEAN := FALSE;
  session_data jsonb;
BEGIN
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('authenticated', false, 'reason', 'not_authenticated');
  END IF;
  
  -- Check if user has admin role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = current_user_id 
    AND role = 'admin'::app_role
  ) INTO user_is_admin;
  
  IF NOT user_is_admin THEN
    RETURN jsonb_build_object('authenticated', false, 'reason', 'not_admin');
  END IF;
  
  -- Log the admin authentication
  PERFORM public.log_security_event(current_user_id, 'admin_authenticated', 
    jsonb_build_object('timestamp', now(), 'ip_address', inet_client_addr()));
  
  RETURN jsonb_build_object(
    'authenticated', true, 
    'user_id', current_user_id,
    'timestamp', now()
  );
END;
$$;

-- Create function to check if current user is admin (for easier RLS policies)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO ''
AS $$
BEGIN
  RETURN public.has_role(auth.uid(), 'admin'::app_role);
END;
$$;

-- Update the admin_sessions table to include more security fields
ALTER TABLE public.admin_sessions 
ADD COLUMN IF NOT EXISTS last_activity timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS session_data jsonb DEFAULT '{}'::jsonb;

-- Create a function to validate and refresh admin sessions
CREATE OR REPLACE FUNCTION public.validate_and_refresh_admin_session(session_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  session_record RECORD;
  current_user_id uuid := auth.uid();
BEGIN
  -- Get session details
  SELECT * INTO session_record
  FROM public.admin_sessions
  WHERE session_token = validate_and_refresh_admin_session.session_token
    AND is_active = true
    AND expires_at > now();
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_or_expired_session');
  END IF;
  
  -- Verify the session belongs to the current authenticated user
  IF current_user_id IS NULL OR session_record.user_id != current_user_id THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'session_user_mismatch');
  END IF;
  
  -- Check if user still has admin role
  IF NOT public.has_role(current_user_id, 'admin'::app_role) THEN
    -- Deactivate session if user no longer has admin role
    UPDATE public.admin_sessions 
    SET is_active = false 
    WHERE session_token = validate_and_refresh_admin_session.session_token;
    
    RETURN jsonb_build_object('valid', false, 'reason', 'admin_role_revoked');
  END IF;
  
  -- Update last activity and extend session
  UPDATE public.admin_sessions 
  SET 
    last_activity = now(),
    expires_at = now() + interval '2 hours'
  WHERE session_token = validate_and_refresh_admin_session.session_token;
  
  -- Log session validation
  PERFORM public.log_security_event(current_user_id, 'admin_session_validated', 
    jsonb_build_object(
      'session_token', session_token, 
      'timestamp', now(),
      'ip_address', inet_client_addr()
    ));
  
  RETURN jsonb_build_object(
    'valid', true, 
    'user_id', session_record.user_id,
    'expires_at', now() + interval '2 hours',
    'session_token', session_token
  );
END;
$$;

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(action_type text, action_details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Only log if user is authenticated and is admin
  IF current_user_id IS NOT NULL AND public.has_role(current_user_id, 'admin'::app_role) THEN
    PERFORM public.log_security_event(current_user_id, 'admin_action', 
      jsonb_build_object(
        'action_type', action_type,
        'action_details', action_details,
        'timestamp', now(),
        'ip_address', inet_client_addr()
      ));
  END IF;
END;
$$;