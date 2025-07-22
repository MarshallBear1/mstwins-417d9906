-- Add last_seen column to track when users were last online
ALTER TABLE public.profiles 
ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to update last_seen timestamp when user comes online
CREATE OR REPLACE FUNCTION public.update_user_last_seen(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_seen = now() 
  WHERE user_id = user_id_param;
END;
$$;