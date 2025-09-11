-- Update the profiles RLS policy to allow users to see basic profile information
-- of other users for forum, messaging, and discovery purposes

-- First, drop the current restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a new policy that allows viewing basic profile information
-- Users can see basic info of all approved profiles for community features
CREATE POLICY "Users can view basic profile information" 
ON public.profiles 
FOR SELECT 
USING (
  moderation_status = 'approved' AND (
    -- Users can always see their own full profile
    auth.uid() = user_id OR
    -- Users can see basic info of other approved profiles for community features
    (auth.uid() IS NOT NULL AND moderation_status = 'approved')
  )
);

-- Also create a policy that allows full profile access for the owner
CREATE POLICY "Users can view their own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);