-- Create a table to track passed profiles for "review skipped" functionality
CREATE TABLE IF NOT EXISTS public.passes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passer_id uuid NOT NULL,
  passed_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(passer_id, passed_id)
);

-- Enable RLS on passes table
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;

-- Create policies for passes table
CREATE POLICY "Users can create passes" 
ON public.passes 
FOR INSERT 
WITH CHECK (auth.uid() = passer_id);

CREATE POLICY "Users can view their own passes" 
ON public.passes 
FOR SELECT 
USING (auth.uid() = passer_id);

CREATE POLICY "Users can delete their own passes" 
ON public.passes 
FOR DELETE 
USING (auth.uid() = passer_id);