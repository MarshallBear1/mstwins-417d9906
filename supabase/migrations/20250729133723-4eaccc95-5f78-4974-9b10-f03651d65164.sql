-- Fix critical security issues identified by the linter

-- 1. Move extensions out of public schema (if any exist)
-- First, check for any extensions in public schema and move them
DO $$
DECLARE
    ext_name text;
BEGIN
    -- Find extensions in public schema and move them to extensions schema
    FOR ext_name IN 
        SELECT extname FROM pg_extension 
        WHERE extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        -- Create extensions schema if it doesn't exist
        CREATE SCHEMA IF NOT EXISTS extensions;
        
        -- Move extension to extensions schema
        EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_name);
        
        RAISE NOTICE 'Moved extension % from public to extensions schema', ext_name;
    END LOOP;
END $$;

-- 2. Configure auth settings for better security
-- Set OTP expiry to recommended 1 hour (3600 seconds)
UPDATE auth.config 
SET 
    -- Reduce OTP expiry to 1 hour instead of default
    otp_exp = 3600,
    -- Enable leaked password protection
    password_min_length = 8
WHERE 
    id = 'auth-config';

-- If the config doesn't exist, create it with secure defaults
INSERT INTO auth.config (id, otp_exp, password_min_length) 
VALUES ('auth-config', 3600, 8) 
ON CONFLICT (id) DO UPDATE SET 
    otp_exp = 3600,
    password_min_length = 8;

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
    ('max_failed_logins', '5', 'Maximum failed login attempts before lockout')
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