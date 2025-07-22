-- Add gender column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gender TEXT;

-- Add a check constraint to ensure valid gender values
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_gender CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say', 'other'));