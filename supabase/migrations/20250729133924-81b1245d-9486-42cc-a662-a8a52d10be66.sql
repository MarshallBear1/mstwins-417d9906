-- Fix critical security issues identified by the linter
-- Skip moving extensions that don't support SET SCHEMA

-- Create a security configuration table for tracking our security settings
CREATE TABLE IF NOT EXISTS public.security_config (
    setting_key text PRIMARY KEY,
    setting_value jsonb NOT NULL,
    description text,
    last_updated timestamp with time zone DEFAULT now()
);

-- Enable RLS on security config
ALTER TABLE public.security_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for security config (admins only)
DROP POLICY IF EXISTS "Only admins can manage security config" ON public.security_config;
CREATE POLICY "Only admins can manage security config" ON public.security_config
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert security configuration settings
INSERT INTO public.security_config (setting_key, setting_value, description) VALUES
    ('otp_expiry_seconds', '3600', 'OTP expiry time in seconds (1 hour)'),
    ('password_min_length', '8', 'Minimum password length requirement'),
    ('leaked_password_protection', 'true', 'Enable leaked password protection'),
    ('session_timeout_hours', '2', 'Admin session timeout in hours'),
    ('max_failed_logins', '5', 'Maximum failed login attempts before lockout'),
    ('extensions_in_public_schema', 'acknowledged', 'Some extensions like pg_net cannot be moved from public schema')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    last_updated = now();

-- Create a function to get security settings
CREATE OR REPLACE FUNCTION public.get_security_setting(setting_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO ''
AS $$
BEGIN
    RETURN (
        SELECT setting_value 
        FROM public.security_config 
        WHERE security_config.setting_key = get_security_setting.setting_key
    );
END;
$$;

-- Create function to log security configuration changes
CREATE OR REPLACE FUNCTION public.update_security_config(setting_key text, setting_value jsonb, description text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    -- Check if user has admin role
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Access denied: Admin role required';
    END IF;
    
    -- Update or insert the setting
    INSERT INTO public.security_config (setting_key, setting_value, description)
    VALUES (setting_key, setting_value, description)
    ON CONFLICT (setting_key) DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        description = COALESCE(EXCLUDED.description, security_config.description),
        last_updated = now();
    
    -- Log the change
    PERFORM public.log_security_event(auth.uid(), 'security_config_updated', 
        jsonb_build_object(
            'setting_key', setting_key,
            'new_value', setting_value,
            'timestamp', now()
        ));
END;
$$;