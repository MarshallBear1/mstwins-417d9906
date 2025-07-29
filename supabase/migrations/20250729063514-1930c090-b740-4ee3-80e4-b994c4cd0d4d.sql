-- Fix auth RLS initialization plan issue for moderation_flags
DROP POLICY IF EXISTS "Admins can manage all moderation flags" ON public.moderation_flags;

CREATE POLICY "Admins can manage all moderation flags" 
ON public.moderation_flags 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

-- Fix multiple permissive policies for moderation_flags by making them more specific
DROP POLICY IF EXISTS "System can create moderation flags" ON public.moderation_flags;

CREATE POLICY "System can create moderation flags" 
ON public.moderation_flags 
FOR INSERT 
WITH CHECK (true);

-- Fix multiple permissive policies for robot_announcements by consolidating
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.robot_announcements;
DROP POLICY IF EXISTS "Everyone can view active announcements" ON public.robot_announcements;

CREATE POLICY "View and manage announcements" 
ON public.robot_announcements 
FOR SELECT 
USING (
  (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()))
  OR has_role((SELECT auth.uid()), 'admin'::app_role)
);

CREATE POLICY "Admins can manage announcements" 
ON public.robot_announcements 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

-- Fix multiple permissive policies for user_roles by consolidating
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "View roles policy" 
ON public.user_roles 
FOR SELECT 
USING (
  ((SELECT auth.uid()) = user_id) 
  OR has_role((SELECT auth.uid()), 'admin'::app_role)
);

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role);