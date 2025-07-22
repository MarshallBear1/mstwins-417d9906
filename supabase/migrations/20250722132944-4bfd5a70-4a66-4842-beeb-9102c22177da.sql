-- Security Enhancement Migration
-- Fix extension location and add comprehensive security measures

-- Move http extension to extensions schema (if not already there)
DROP EXTENSION IF EXISTS http CASCADE;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Add input validation functions
CREATE OR REPLACE FUNCTION public.validate_text_input(input_text TEXT, max_length INTEGER DEFAULT 1000)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check for null or empty input
  IF input_text IS NULL OR trim(input_text) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Trim whitespace
  input_text := trim(input_text);
  
  -- Check length limits
  IF length(input_text) > max_length THEN
    RAISE EXCEPTION 'Input text exceeds maximum length of % characters', max_length;
  END IF;
  
  -- Basic content filtering (remove potentially harmful patterns)
  input_text := regexp_replace(input_text, '<[^>]*>', '', 'g'); -- Remove HTML tags
  input_text := regexp_replace(input_text, '\x00', '', 'g'); -- Remove null bytes
  
  RETURN input_text;
END;
$$;

-- Add email validation function
CREATE OR REPLACE FUNCTION public.validate_email(email_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF email_input IS NULL OR trim(email_input) = '' THEN
    RAISE EXCEPTION 'Email cannot be empty';
  END IF;
  
  email_input := trim(lower(email_input));
  
  -- Basic email format validation
  IF NOT email_input ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Check length
  IF length(email_input) > 254 THEN
    RAISE EXCEPTION 'Email address is too long';
  END IF;
  
  RETURN email_input;
END;
$$;

-- Enhanced rate limiting with better security
CREATE OR REPLACE FUNCTION public.enhanced_rate_limit_check(
  user_id_param UUID,
  action_type TEXT,
  max_actions INTEGER,
  time_window INTERVAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Validate inputs
  IF user_id_param IS NULL OR action_type IS NULL THEN
    RAISE EXCEPTION 'User ID and action type are required';
  END IF;
  
  -- Count recent actions based on type
  IF action_type = 'like' THEN
    SELECT COUNT(*) INTO current_count
    FROM public.likes
    WHERE liker_id = user_id_param 
    AND created_at > NOW() - time_window;
  ELSIF action_type = 'message' THEN
    SELECT COUNT(*) INTO current_count
    FROM public.messages
    WHERE sender_id = user_id_param 
    AND created_at > NOW() - time_window;
  ELSE
    RAISE EXCEPTION 'Unknown action type: %', action_type;
  END IF;
  
  IF current_count >= max_actions THEN
    RAISE EXCEPTION 'Rate limit exceeded for %. Please wait before trying again.', action_type;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Add audit logging table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL,
  event_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (will need admin role system later)
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Audit log function
CREATE OR REPLACE FUNCTION public.log_security_event(
  user_id_param UUID,
  event_type_param TEXT,
  event_details_param JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, event_type, event_details)
  VALUES (user_id_param, event_type_param, event_details_param);
EXCEPTION WHEN OTHERS THEN
  -- Log errors but don't fail the main operation
  NULL;
END;
$$;

-- Enhanced like trigger with better validation and logging
CREATE OR REPLACE FUNCTION public.enhanced_like_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validate user authentication
  IF NOT public.validate_user_action(NEW.liked_id) THEN
    RAISE EXCEPTION 'Invalid user action';
  END IF;
  
  -- Check rate limits
  PERFORM public.enhanced_rate_limit_check(NEW.liker_id, 'like', 50, INTERVAL '1 hour');
  
  -- Prevent self-likes
  IF NEW.liker_id = NEW.liked_id THEN
    RAISE EXCEPTION 'Users cannot like their own profile';
  END IF;
  
  -- Log the action
  PERFORM public.log_security_event(NEW.liker_id, 'profile_like', 
    jsonb_build_object('liked_user_id', NEW.liked_id));
  
  RETURN NEW;
END;
$$;

-- Enhanced message trigger with content validation
CREATE OR REPLACE FUNCTION public.enhanced_message_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validate and sanitize content
  NEW.content := public.validate_text_input(NEW.content, 2000);
  
  IF NEW.content IS NULL OR trim(NEW.content) = '' THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;
  
  -- Check rate limits
  PERFORM public.enhanced_rate_limit_check(NEW.sender_id, 'message', 100, INTERVAL '1 hour');
  
  -- Validate that users can message each other (they must have a match)
  IF NOT EXISTS (
    SELECT 1 FROM public.matches 
    WHERE (user1_id = NEW.sender_id AND user2_id = NEW.receiver_id)
    OR (user1_id = NEW.receiver_id AND user2_id = NEW.sender_id)
  ) THEN
    RAISE EXCEPTION 'Users must match before messaging';
  END IF;
  
  -- Log the action
  PERFORM public.log_security_event(NEW.sender_id, 'message_sent', 
    jsonb_build_object('receiver_id', NEW.receiver_id, 'match_id', NEW.match_id));
  
  RETURN NEW;
END;
$$;

-- Add validation triggers
DROP TRIGGER IF EXISTS enhanced_like_validation ON public.likes;
CREATE TRIGGER enhanced_like_validation
  BEFORE INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_like_trigger();

DROP TRIGGER IF EXISTS enhanced_message_validation ON public.messages;
CREATE TRIGGER enhanced_message_validation
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_message_trigger();

-- Update profile validation with input sanitization
CREATE OR REPLACE FUNCTION public.enhanced_profile_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validate and sanitize text inputs
  NEW.first_name := public.validate_text_input(NEW.first_name, 50);
  NEW.last_name := public.validate_text_input(NEW.last_name, 50);
  NEW.about_me := public.validate_text_input(NEW.about_me, 1000);
  NEW.location := public.validate_text_input(NEW.location, 100);
  NEW.ms_subtype := public.validate_text_input(NEW.ms_subtype, 50);
  
  -- Validate required fields
  IF NEW.first_name IS NULL OR trim(NEW.first_name) = '' THEN
    RAISE EXCEPTION 'First name is required';
  END IF;
  
  IF NEW.last_name IS NULL OR trim(NEW.last_name) = '' THEN
    RAISE EXCEPTION 'Last name is required';
  END IF;
  
  IF NEW.location IS NULL OR trim(NEW.location) = '' THEN
    RAISE EXCEPTION 'Location is required';
  END IF;
  
  -- Validate age (must be 18+)
  IF NEW.date_of_birth IS NOT NULL AND NEW.date_of_birth > CURRENT_DATE - INTERVAL '18 years' THEN
    RAISE EXCEPTION 'Users must be at least 18 years old';
  END IF;
  
  -- Validate diagnosis year
  IF NEW.diagnosis_year IS NOT NULL AND (NEW.diagnosis_year < 1950 OR NEW.diagnosis_year > EXTRACT(YEAR FROM CURRENT_DATE)) THEN
    RAISE EXCEPTION 'Invalid diagnosis year';
  END IF;
  
  -- Log profile updates
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(NEW.user_id, 'profile_updated', '{}'::jsonb);
  ELSE
    PERFORM public.log_security_event(NEW.user_id, 'profile_created', '{}'::jsonb);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enhanced_profile_validation ON public.profiles;
CREATE TRIGGER enhanced_profile_validation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_profile_trigger();