-- Create secure admin session management
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '2 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS on admin sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for admin sessions
CREATE POLICY "Users can manage their own admin sessions" 
ON public.admin_sessions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to validate admin session
CREATE OR REPLACE FUNCTION public.validate_admin_session(session_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  session_record RECORD;
  user_is_admin BOOLEAN := FALSE;
BEGIN
  -- Check if session exists and is valid
  SELECT * INTO session_record
  FROM public.admin_sessions
  WHERE session_token = validate_admin_session.session_token
    AND is_active = true
    AND expires_at > now();
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_session');
  END IF;
  
  -- Check if user has admin role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = session_record.user_id 
    AND role = 'admin'::app_role
  ) INTO user_is_admin;
  
  IF NOT user_is_admin THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_admin');
  END IF;
  
  -- Update last activity
  UPDATE public.admin_sessions 
  SET expires_at = now() + interval '2 hours'
  WHERE session_token = validate_admin_session.session_token;
  
  RETURN jsonb_build_object(
    'valid', true, 
    'user_id', session_record.user_id,
    'expires_at', session_record.expires_at
  );
END;
$$;

-- Create function to create admin session
CREATE OR REPLACE FUNCTION public.create_admin_session()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  new_session_token uuid := gen_random_uuid();
  user_is_admin BOOLEAN := FALSE;
BEGIN
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
  END IF;
  
  -- Check if user has admin role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = current_user_id 
    AND role = 'admin'::app_role
  ) INTO user_is_admin;
  
  IF NOT user_is_admin THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_admin');
  END IF;
  
  -- Deactivate any existing sessions for this user
  UPDATE public.admin_sessions 
  SET is_active = false 
  WHERE user_id = current_user_id AND is_active = true;
  
  -- Create new session
  INSERT INTO public.admin_sessions (user_id, session_token)
  VALUES (current_user_id, new_session_token);
  
  RETURN jsonb_build_object(
    'success', true, 
    'session_token', new_session_token,
    'expires_at', now() + interval '2 hours'
  );
END;
$$;

-- Create function to revoke admin session
CREATE OR REPLACE FUNCTION public.revoke_admin_session(session_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.admin_sessions 
  SET is_active = false 
  WHERE session_token = revoke_admin_session.session_token
    AND user_id = auth.uid();
    
  RETURN FOUND;
END;
$$;

-- Create secure feedback access function
CREATE OR REPLACE FUNCTION public.get_feedback_admin()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  type text,
  subject text,
  message text,
  email text,
  priority text,
  status text,
  admin_notes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Check if user has admin role
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT f.id, f.user_id, f.type, f.subject, f.message, f.email, 
         f.priority, f.status, f.admin_notes, f.created_at, f.updated_at
  FROM public.feedback f
  ORDER BY f.created_at DESC;
END;
$$;

-- Create secure feedback update function
CREATE OR REPLACE FUNCTION public.update_feedback_admin(
  feedback_id uuid,
  new_status text,
  new_admin_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Check if user has admin role
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Validate status
  IF new_status NOT IN ('open', 'in_progress', 'resolved', 'closed') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;
  
  UPDATE public.feedback 
  SET 
    status = new_status,
    admin_notes = COALESCE(new_admin_notes, admin_notes),
    updated_at = now()
  WHERE id = feedback_id;
  
  RETURN FOUND;
END;
$$;