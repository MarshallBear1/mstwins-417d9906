-- Create a simple flag to disable email processing
CREATE TABLE IF NOT EXISTS public.system_flags (
  flag_name TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert flag to disable email processing
INSERT INTO public.system_flags (flag_name, enabled)
VALUES ('email_processing_enabled', false)
ON CONFLICT (flag_name) DO UPDATE SET enabled = false, updated_at = now();