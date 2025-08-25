-- Fix critical RLS policy vulnerabilities
-- Phase 1: Secure system tables from public access

-- 1. Fix feedback table - users can only see their own feedback, admins can see all
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can create feedback" ON public.feedback;

CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT 
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create feedback" ON public.feedback
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can update feedback" ON public.feedback
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix failed_login_attempts - system only
DROP POLICY IF EXISTS "System can manage failed login attempts" ON public.failed_login_attempts;

CREATE POLICY "Service role can manage failed login attempts" ON public.failed_login_attempts
  FOR ALL 
  USING (auth.role() = 'service_role'::text);

-- 3. Fix email_queue - system only
DROP POLICY IF EXISTS "System can manage email queue" ON public.email_queue;

CREATE POLICY "Service role can manage email queue" ON public.email_queue
  FOR ALL 
  USING (auth.role() = 'service_role'::text);

-- 4. Fix re_engagement_emails - system only  
DROP POLICY IF EXISTS "System can manage re-engagement emails" ON public.re_engagement_emails;

CREATE POLICY "Service role can manage re-engagement emails" ON public.re_engagement_emails
  FOR ALL 
  USING (auth.role() = 'service_role'::text);

-- 5. Fix notification_logs - system only
DROP POLICY IF EXISTS "System can manage notification logs" ON public.notification_logs;

CREATE POLICY "Service role can manage notification logs" ON public.notification_logs
  FOR ALL 
  USING (auth.role() = 'service_role'::text);

-- 6. Fix email_processing_log - system only
DROP POLICY IF EXISTS "System can manage email processing log" ON public.email_processing_log;

CREATE POLICY "Service role can manage email processing log" ON public.email_processing_log
  FOR ALL 
  USING (auth.role() = 'service_role'::text);

-- 7. Fix function search paths (Security warning fix)
-- Update all functions to have explicit search paths
CREATE OR REPLACE FUNCTION public.validate_text_input(input_text text, max_length integer DEFAULT 1000)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.validate_email(email_input text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Update other critical security functions with search paths
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.log_security_event(user_id_param uuid, event_type_param text, event_details_param jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (user_id, event_type, event_details)
  VALUES (user_id_param, event_type_param, event_details_param);
EXCEPTION WHEN OTHERS THEN
  -- Log errors but don't fail the main operation
  NULL;
END;
$function$;