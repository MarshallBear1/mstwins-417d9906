-- Create email processing log table first
CREATE TABLE IF NOT EXISTS public.email_processing_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'triggered',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create welcome email queue table
CREATE TABLE IF NOT EXISTS public.welcome_email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create welcome email trigger for new user signups
CREATE OR REPLACE FUNCTION public.send_welcome_email_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
BEGIN
  -- Get the user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Get the first name from the profile
  user_first_name := NEW.first_name;
  
  -- Queue welcome email by inserting into a simple notification table
  INSERT INTO public.welcome_email_queue (user_id, email, first_name)
  VALUES (NEW.user_id, user_email, user_first_name)
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate welcome emails
  
  RETURN NEW;
END;
$function$;

-- Create trigger for welcome emails on profile creation
DROP TRIGGER IF EXISTS trigger_welcome_email ON public.profiles;
CREATE TRIGGER trigger_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_trigger();