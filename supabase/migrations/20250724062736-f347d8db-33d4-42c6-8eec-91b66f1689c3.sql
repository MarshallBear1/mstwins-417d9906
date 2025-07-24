-- Phase 1: Security Hardening

-- Create security settings table for configurable security parameters
CREATE TABLE public.security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage security settings
CREATE POLICY "Admins can manage security settings" 
ON public.security_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Insert default security settings
INSERT INTO public.security_settings (setting_key, setting_value) VALUES
('password_min_length', '8'),
('password_require_uppercase', 'true'),
('password_require_lowercase', 'true'), 
('password_require_numbers', 'true'),
('password_require_symbols', 'true'),
('max_login_attempts', '5'),
('lockout_duration_minutes', '15'),
('api_version', '1'),
('rate_limit_like_per_hour', '50'),
('rate_limit_message_per_hour', '100');

-- Create failed login attempts tracking
CREATE TABLE public.failed_login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address INET,
  attempt_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- System can manage failed login attempts
CREATE POLICY "System can manage failed login attempts" 
ON public.failed_login_attempts 
FOR ALL 
USING (true);

-- Create password validation function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  settings JSONB;
  result JSONB := '{"valid": true, "errors": []}'::JSONB;
  errors TEXT[] := '{}';
BEGIN
  -- Get password settings
  SELECT jsonb_object_agg(setting_key, setting_value) INTO settings
  FROM public.security_settings 
  WHERE setting_key LIKE 'password_%';
  
  -- Check minimum length
  IF length(password_input) < (settings->>'password_min_length')::INTEGER THEN
    errors := array_append(errors, 'Password must be at least ' || (settings->>'password_min_length') || ' characters long');
  END IF;
  
  -- Check uppercase requirement
  IF (settings->>'password_require_uppercase')::BOOLEAN AND password_input !~ '[A-Z]' THEN
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Check lowercase requirement
  IF (settings->>'password_require_lowercase')::BOOLEAN AND password_input !~ '[a-z]' THEN
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Check numbers requirement
  IF (settings->>'password_require_numbers')::BOOLEAN AND password_input !~ '[0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one number');
  END IF;
  
  -- Check symbols requirement
  IF (settings->>'password_require_symbols')::BOOLEAN AND password_input !~ '[^A-Za-z0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one special character');
  END IF;
  
  -- Check for common weak patterns
  IF password_input ~* '^(password|123456|qwerty|abc123|admin|letmein)' THEN
    errors := array_append(errors, 'Password contains common weak patterns');
  END IF;
  
  -- Build result
  IF array_length(errors, 1) > 0 THEN
    result := jsonb_build_object('valid', false, 'errors', errors);
  END IF;
  
  RETURN result;
END;
$$;

-- Create function to check login attempt limits
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(email_input TEXT, ip_input INET DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  max_attempts INTEGER;
  lockout_duration INTERVAL;
  recent_attempts INTEGER;
  last_attempt TIMESTAMP WITH TIME ZONE;
  result JSONB;
BEGIN
  -- Get settings
  SELECT (setting_value::TEXT)::INTEGER INTO max_attempts
  FROM public.security_settings 
  WHERE setting_key = 'max_login_attempts';
  
  SELECT INTERVAL '1 minute' * (setting_value::TEXT)::INTEGER INTO lockout_duration
  FROM public.security_settings 
  WHERE setting_key = 'lockout_duration_minutes';
  
  -- Count recent failed attempts for this email
  SELECT COUNT(*), MAX(attempt_time) INTO recent_attempts, last_attempt
  FROM public.failed_login_attempts
  WHERE email = email_input 
  AND attempt_time > NOW() - lockout_duration;
  
  -- Check if account is locked out
  IF recent_attempts >= max_attempts THEN
    result := jsonb_build_object(
      'allowed', false, 
      'reason', 'account_locked',
      'lockout_until', last_attempt + lockout_duration,
      'attempts_remaining', 0
    );
  ELSE
    result := jsonb_build_object(
      'allowed', true,
      'attempts_remaining', max_attempts - recent_attempts
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Create function to log failed login attempt
CREATE OR REPLACE FUNCTION public.log_failed_login_attempt(email_input TEXT, ip_input INET DEFAULT NULL, user_agent_input TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.failed_login_attempts (email, ip_address, user_agent)
  VALUES (email_input, ip_input, user_agent_input);
  
  -- Clean up old attempts (older than 24 hours)
  DELETE FROM public.failed_login_attempts 
  WHERE attempt_time < NOW() - INTERVAL '24 hours';
END;
$$;

-- Create function to clear failed login attempts on successful login
CREATE OR REPLACE FUNCTION public.clear_failed_login_attempts(email_input TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.failed_login_attempts 
  WHERE email = email_input;
END;
$$;

-- Create API versioning function
CREATE OR REPLACE FUNCTION public.get_api_version()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  version TEXT;
BEGIN
  SELECT setting_value::TEXT INTO version
  FROM public.security_settings 
  WHERE setting_key = 'api_version';
  
  RETURN COALESCE(version, '1');
END;
$$;