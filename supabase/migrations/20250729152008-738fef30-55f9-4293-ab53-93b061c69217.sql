-- Enhanced security functions for admin operations

-- Function to validate admin input with additional security checks
CREATE OR REPLACE FUNCTION public.validate_admin_input_security(
  input_data jsonb,
  validation_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  result jsonb := '{"valid": true, "errors": []}'::jsonb;
  errors text[] := '{}';
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if user has admin role
  IF NOT public.has_role(current_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Validate based on type
  CASE validation_type
    WHEN 'feedback_update' THEN
      -- Validate feedback status
      IF input_data->>'status' IS NOT NULL AND 
         NOT (input_data->>'status' IN ('open', 'in_progress', 'resolved', 'closed')) THEN
        errors := array_append(errors, 'Invalid feedback status');
      END IF;
      
      -- Validate admin notes length
      IF input_data->>'admin_notes' IS NOT NULL AND 
         length(input_data->>'admin_notes') > 2000 THEN
        errors := array_append(errors, 'Admin notes exceed maximum length');
      END IF;
      
    WHEN 'moderation_decision' THEN
      -- Validate moderation status
      IF input_data->>'status' IS NOT NULL AND 
         NOT (input_data->>'status' IN ('pending', 'approved', 'rejected', 'under_review')) THEN
        errors := array_append(errors, 'Invalid moderation status');
      END IF;
      
      -- Validate decision reason
      IF input_data->>'decision_reason' IS NOT NULL AND 
         length(input_data->>'decision_reason') > 500 THEN
        errors := array_append(errors, 'Decision reason exceeds maximum length');
      END IF;
      
    WHEN 'email_operation' THEN
      -- Validate email type
      IF input_data->>'email_type' IS NOT NULL AND 
         NOT (input_data->>'email_type' IN ('day2', 'day3', 'day4', 'likes_reset', 're_engagement')) THEN
        errors := array_append(errors, 'Invalid email type');
      END IF;
      
      -- Validate recipient email if provided
      IF input_data->>'recipient_email' IS NOT NULL THEN
        PERFORM public.validate_email(input_data->>'recipient_email');
      END IF;
      
    ELSE
      errors := array_append(errors, 'Unknown validation type');
  END CASE;
  
  -- Build result
  IF array_length(errors, 1) > 0 THEN
    result := jsonb_build_object('valid', false, 'errors', errors);
  END IF;
  
  -- Log validation attempt
  PERFORM public.log_security_event(
    current_user_id, 
    'admin_input_validation', 
    jsonb_build_object(
      'validation_type', validation_type,
      'valid', (result->>'valid')::boolean,
      'error_count', array_length(errors, 1)
    )
  );
  
  RETURN result;
END;
$$;

-- Enhanced admin session validation with additional security checks
CREATE OR REPLACE FUNCTION public.enhanced_validate_admin_session(session_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  session_record RECORD;
  current_user_id uuid := auth.uid();
  ip_address inet := inet_client_addr();
  user_agent text := current_setting('request.headers', true)::json->>'user-agent';
BEGIN
  -- Check if session exists and is valid
  SELECT * INTO session_record
  FROM public.admin_sessions
  WHERE session_token = enhanced_validate_admin_session.session_token
    AND is_active = true
    AND expires_at > now();
    
  IF NOT FOUND THEN
    -- Log failed session validation
    PERFORM public.log_security_event(
      current_user_id, 
      'admin_session_validation_failed', 
      jsonb_build_object(
        'reason', 'session_not_found_or_expired',
        'ip_address', ip_address,
        'user_agent', user_agent
      )
    );
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_session');
  END IF;
  
  -- Verify the session belongs to the current authenticated user
  IF current_user_id IS NULL OR session_record.user_id != current_user_id THEN
    -- Log session mismatch
    PERFORM public.log_security_event(
      current_user_id, 
      'admin_session_user_mismatch', 
      jsonb_build_object(
        'session_user_id', session_record.user_id,
        'current_user_id', current_user_id,
        'ip_address', ip_address
      )
    );
    RETURN jsonb_build_object('valid', false, 'reason', 'session_user_mismatch');
  END IF;
  
  -- Check if user still has admin role
  IF NOT public.has_role(current_user_id, 'admin'::app_role) THEN
    -- Deactivate session if user no longer has admin role
    UPDATE public.admin_sessions 
    SET is_active = false 
    WHERE session_token = enhanced_validate_admin_session.session_token;
    
    PERFORM public.log_security_event(
      current_user_id, 
      'admin_role_revoked_session_invalidated', 
      jsonb_build_object('session_token', session_token)
    );
    
    RETURN jsonb_build_object('valid', false, 'reason', 'admin_role_revoked');
  END IF;
  
  -- Check for suspicious session activity
  IF session_record.ip_address IS NOT NULL AND 
     session_record.ip_address != ip_address THEN
    -- Log IP address change (could be legitimate or suspicious)
    PERFORM public.log_security_event(
      current_user_id, 
      'admin_session_ip_change', 
      jsonb_build_object(
        'old_ip', session_record.ip_address,
        'new_ip', ip_address,
        'session_token', session_token
      )
    );
  END IF;
  
  -- Update session with current activity
  UPDATE public.admin_sessions 
  SET 
    last_activity = now(),
    expires_at = now() + interval '2 hours',
    ip_address = COALESCE(ip_address, session_record.ip_address),
    user_agent = COALESCE(user_agent, session_record.user_agent)
  WHERE session_token = enhanced_validate_admin_session.session_token;
  
  -- Log successful validation
  PERFORM public.log_security_event(
    current_user_id, 
    'admin_session_validated', 
    jsonb_build_object(
      'session_token', session_token,
      'ip_address', ip_address,
      'expires_at', now() + interval '2 hours'
    )
  );
  
  RETURN jsonb_build_object(
    'valid', true, 
    'user_id', session_record.user_id,
    'expires_at', now() + interval '2 hours',
    'session_token', session_token
  );
END;
$$;

-- Function to check admin rate limits with enhanced security
CREATE OR REPLACE FUNCTION public.check_admin_rate_limit(
  admin_user_id uuid,
  action_type text,
  time_window interval DEFAULT '1 hour'::interval,
  max_actions integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_count integer;
  result jsonb;
BEGIN
  -- Check if user has admin role
  IF NOT public.has_role(admin_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Count recent admin actions from security audit log
  SELECT COUNT(*) INTO current_count
  FROM public.security_audit_log
  WHERE user_id = admin_user_id
    AND event_type = 'admin_action'
    AND event_details->>'action_type' = action_type
    AND created_at > now() - time_window;
  
  -- Check if limit exceeded
  IF current_count >= max_actions THEN
    -- Log rate limit exceeded
    PERFORM public.log_security_event(
      admin_user_id, 
      'admin_rate_limit_exceeded', 
      jsonb_build_object(
        'action_type', action_type,
        'current_count', current_count,
        'max_actions', max_actions,
        'time_window', time_window
      )
    );
    
    result := jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'current_count', current_count,
      'max_actions', max_actions,
      'reset_time', now() + time_window
    );
  ELSE
    result := jsonb_build_object(
      'allowed', true,
      'remaining', max_actions - current_count,
      'current_count', current_count
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Enhanced admin audit logging
CREATE OR REPLACE FUNCTION public.enhanced_log_admin_action(
  action_type text, 
  action_details jsonb DEFAULT '{}'::jsonb,
  security_level text DEFAULT 'normal'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  ip_address inet := inet_client_addr();
  user_agent text := current_setting('request.headers', true)::json->>'user-agent';
BEGIN
  -- Only log if user is authenticated and is admin
  IF current_user_id IS NOT NULL AND public.has_role(current_user_id, 'admin'::app_role) THEN
    PERFORM public.log_security_event(
      current_user_id, 
      'admin_action', 
      jsonb_build_object(
        'action_type', action_type,
        'action_details', action_details,
        'security_level', security_level,
        'timestamp', now(),
        'ip_address', ip_address,
        'user_agent', user_agent,
        'session_info', jsonb_build_object(
          'session_exists', (SELECT COUNT(*) > 0 FROM public.admin_sessions WHERE user_id = current_user_id AND is_active = true),
          'url', current_setting('request.url', true)
        )
      )
    );
    
    -- For high-security actions, create additional audit entry
    IF security_level = 'high' THEN
      INSERT INTO public.security_audit_log (
        user_id, 
        event_type, 
        event_details,
        ip_address,
        user_agent
      ) VALUES (
        current_user_id,
        'high_security_admin_action',
        jsonb_build_object(
          'action_type', action_type,
          'action_details', action_details,
          'timestamp', now()
        ),
        ip_address,
        user_agent
      );
    END IF;
  END IF;
END;
$$;