-- Fix critical security vulnerability in welcome_email_queue table
-- Remove overly permissive policy that allows public access to user emails
DROP POLICY IF EXISTS "System can manage welcome email queue" ON public.welcome_email_queue;

-- Create secure policies that only allow system processes to access the queue
CREATE POLICY "Service role can manage welcome email queue"
ON public.welcome_email_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated edge functions to process the queue
CREATE POLICY "Edge functions can process welcome email queue"
ON public.welcome_email_queue
FOR ALL
USING (auth.role() = 'service_role' OR current_setting('role') = 'service_role')
WITH CHECK (auth.role() = 'service_role' OR current_setting('role') = 'service_role');