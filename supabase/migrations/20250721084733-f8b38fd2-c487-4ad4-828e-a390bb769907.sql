-- Allow users to view other users' profiles for discovery
CREATE POLICY "Users can view profiles for discovery" 
ON public.profiles 
FOR SELECT 
USING (true);