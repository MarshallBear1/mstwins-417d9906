-- Add extended profile fields for "onboarding two"
ALTER TABLE public.profiles 
ADD COLUMN additional_photos TEXT[] DEFAULT '{}',
ADD COLUMN selected_prompts JSONB DEFAULT '[]',
ADD COLUMN extended_profile_completed BOOLEAN DEFAULT false;

-- Add some indexes for better performance
CREATE INDEX idx_profiles_extended_completed ON public.profiles(extended_profile_completed);

-- Update the updated_at trigger to include new columns
-- (The trigger already exists, so no need to recreate it)