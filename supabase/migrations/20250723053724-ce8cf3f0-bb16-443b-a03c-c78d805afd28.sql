-- Enable RLS on the new tables
ALTER TABLE public.email_processing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welcome_email_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_processing_log (system-only access)
CREATE POLICY "System can manage email processing log" 
ON public.email_processing_log 
FOR ALL 
USING (true);

-- Create RLS policies for welcome_email_queue (system-only access)
CREATE POLICY "System can manage welcome email queue" 
ON public.welcome_email_queue 
FOR ALL 
USING (true);