-- Add RLS policy for the system_flags table
ALTER TABLE public.system_flags ENABLE ROW LEVEL SECURITY;

-- Allow service role to read/write system flags
CREATE POLICY "Service role can manage system flags" ON public.system_flags
FOR ALL USING (auth.role() = 'service_role');