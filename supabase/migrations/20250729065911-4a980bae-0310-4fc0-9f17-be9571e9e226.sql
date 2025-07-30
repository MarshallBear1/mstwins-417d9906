-- Fix multiple permissive policies by consolidating overlapping policies

-- Drop overlapping policies for moderation_flags table
DROP POLICY IF EXISTS "System can create moderation flags" ON public.moderation_flags;

-- Drop overlapping policies for robot_announcements table
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.robot_announcements;

-- Drop overlapping policies for user_roles table  
DROP POLICY IF EXISTS "View roles policy" ON public.user_roles;

-- Create consolidated policies with proper restrictions

-- For moderation_flags: Only allow system/admin operations
CREATE POLICY "System and admins can manage moderation flags"
ON public.moderation_flags
FOR ALL
USING (
  -- Allow admins to do everything
  has_role(auth.uid(), 'admin'::app_role)
  OR 
  -- Allow system operations (functions) to create flags
  current_setting('role') = 'service_role'
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR 
  current_setting('role') = 'service_role'
);

-- For robot_announcements: Admins can manage, users can view active ones
CREATE POLICY "Users can view active announcements, admins can manage all"
ON public.robot_announcements
FOR SELECT
USING (
  -- Admins can see all announcements
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Regular users can only see active announcements within date range
  (
    is_active = true 
    AND (start_date IS NULL OR start_date <= now()) 
    AND (end_date IS NULL OR end_date >= now())
  )
);

-- For user_roles: Users can see their own roles, admins can see all
CREATE POLICY "Users can view own roles, admins can manage all roles"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add indexes for unindexed foreign keys to improve query performance

-- Admin sessions user_id foreign key
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON public.admin_sessions(user_id);

-- Messages foreign keys
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_moderation_flag_id ON public.messages(moderation_flag_id);

-- Profiles moderation_flag_id foreign key  
CREATE INDEX IF NOT EXISTS idx_profiles_moderation_flag_id ON public.profiles(moderation_flag_id);

-- User reports foreign keys
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user_id ON public.user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter_id ON public.user_reports(reporter_id);

-- Drop unused indexes on feedback table
DROP INDEX IF EXISTS idx_feedback_status;
DROP INDEX IF EXISTS idx_feedback_created_at;
DROP INDEX IF EXISTS idx_feedback_user_id;