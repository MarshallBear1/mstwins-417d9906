-- Fix RLS performance issues by optimizing auth.uid() calls
-- This prevents re-evaluation of auth.uid() for each row

-- Drop existing policies that have performance issues
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can delete their own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can create notifications for others" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete likes they gave" ON public.likes;
DROP POLICY IF EXISTS "Users can view likes they gave or received" ON public.likes;
DROP POLICY IF EXISTS "Users can delete messages they sent or received" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own daily likes" ON public.daily_likes;
DROP POLICY IF EXISTS "Users can view their own daily likes" ON public.daily_likes;
DROP POLICY IF EXISTS "Admins can update reports" ON public.user_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.user_reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.user_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.user_reports;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.robot_announcements;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profile data for discovery" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users can create passes" ON public.passes;
DROP POLICY IF EXISTS "Users can delete their own passes" ON public.passes;
DROP POLICY IF EXISTS "Users can view their own passes" ON public.passes;
DROP POLICY IF EXISTS "Admins can manage security settings" ON public.security_settings;
DROP POLICY IF EXISTS "Users can manage their own admin sessions" ON public.admin_sessions;

-- Create optimized policies for feedback table
CREATE POLICY "Users can view their own feedback" 
ON public.feedback 
FOR SELECT 
USING (((select auth.uid()) = user_id) OR (user_id IS NULL));

-- Create optimized policies for matches table
CREATE POLICY "Users can delete their own matches" 
ON public.matches 
FOR DELETE 
USING (((select auth.uid()) = user1_id) OR ((select auth.uid()) = user2_id));

CREATE POLICY "Users can view their own matches" 
ON public.matches 
FOR SELECT 
USING (((select auth.uid()) = user1_id) OR ((select auth.uid()) = user2_id));

-- Create optimized policies for notifications table
CREATE POLICY "Users can create notifications for others" 
ON public.notifications 
FOR INSERT 
WITH CHECK (((select auth.uid()) = from_user_id) OR (from_user_id IS NULL));

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING ((select auth.uid()) = user_id);

-- Create optimized policies for likes table
CREATE POLICY "Users can create likes" 
ON public.likes 
FOR INSERT 
WITH CHECK ((select auth.uid()) = liker_id);

CREATE POLICY "Users can delete likes they gave" 
ON public.likes 
FOR DELETE 
USING ((select auth.uid()) = liker_id);

CREATE POLICY "Users can view likes they gave or received" 
ON public.likes 
FOR SELECT 
USING (((select auth.uid()) = liker_id) OR ((select auth.uid()) = liked_id));

-- Create optimized policies for messages table
CREATE POLICY "Users can delete messages they sent or received" 
ON public.messages 
FOR DELETE 
USING (((select auth.uid()) = sender_id) OR ((select auth.uid()) = receiver_id));

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK ((select auth.uid()) = sender_id);

CREATE POLICY "Users can update messages they received" 
ON public.messages 
FOR UPDATE 
USING ((select auth.uid()) = receiver_id);

CREATE POLICY "Users can view messages they sent or received" 
ON public.messages 
FOR SELECT 
USING (((select auth.uid()) = sender_id) OR ((select auth.uid()) = receiver_id));

-- Create optimized policies for user_roles table
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING ((select auth.uid()) = user_id);

-- Create consolidated policy for daily_likes table (combining multiple permissive policies)
CREATE POLICY "Users can manage their own daily likes" 
ON public.daily_likes 
FOR ALL 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Create optimized policies for user_reports table
CREATE POLICY "Admins can update reports" 
ON public.user_reports 
FOR UPDATE 
USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Users can manage their own reports and admins can view all" 
ON public.user_reports 
FOR SELECT 
USING (((select auth.uid()) = reporter_id) OR has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Users can create reports" 
ON public.user_reports 
FOR INSERT 
WITH CHECK ((select auth.uid()) = reporter_id);

-- Create optimized policies for robot_announcements table
CREATE POLICY "Admins can manage announcements" 
ON public.robot_announcements 
FOR ALL 
USING (has_role((select auth.uid()), 'admin'::app_role));

-- Create consolidated policy for profiles table (combining multiple permissive policies)
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Profile visibility policy" 
ON public.profiles 
FOR SELECT 
USING (((select auth.uid()) = user_id) OR ((select auth.uid()) IS NOT NULL AND id IS NOT NULL));

-- Add DELETE policy for profiles (users can delete their own profile)
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING ((select auth.uid()) = user_id);

-- Create optimized policies for push_tokens table
CREATE POLICY "Users can manage their own push tokens" 
ON public.push_tokens 
FOR ALL 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Create optimized policies for passes table
CREATE POLICY "Users can create passes" 
ON public.passes 
FOR INSERT 
WITH CHECK ((select auth.uid()) = passer_id);

CREATE POLICY "Users can delete their own passes" 
ON public.passes 
FOR DELETE 
USING ((select auth.uid()) = passer_id);

CREATE POLICY "Users can view their own passes" 
ON public.passes 
FOR SELECT 
USING ((select auth.uid()) = passer_id);

-- Create optimized policies for security_settings table
CREATE POLICY "Admins can manage security settings" 
ON public.security_settings 
FOR ALL 
USING (has_role((select auth.uid()), 'admin'::app_role));

-- Create optimized policies for admin_sessions table
CREATE POLICY "Users can manage their own admin sessions" 
ON public.admin_sessions 
FOR ALL 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Create function to handle user deletion
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to delete account';
  END IF;
  
  -- Delete user data in the correct order (respecting foreign key constraints)
  -- Delete dependent records first
  DELETE FROM public.messages WHERE sender_id = current_user_id OR receiver_id = current_user_id;
  DELETE FROM public.likes WHERE liker_id = current_user_id OR liked_id = current_user_id;
  DELETE FROM public.passes WHERE passer_id = current_user_id OR passed_id = current_user_id;
  DELETE FROM public.matches WHERE user1_id = current_user_id OR user2_id = current_user_id;
  DELETE FROM public.notifications WHERE user_id = current_user_id OR from_user_id = current_user_id;
  DELETE FROM public.push_tokens WHERE user_id = current_user_id;
  DELETE FROM public.daily_likes WHERE user_id = current_user_id;
  DELETE FROM public.user_reports WHERE reporter_id = current_user_id OR reported_user_id = current_user_id;
  DELETE FROM public.feedback WHERE user_id = current_user_id;
  DELETE FROM public.user_roles WHERE user_id = current_user_id;
  DELETE FROM public.admin_sessions WHERE user_id = current_user_id;
  DELETE FROM public.re_engagement_emails WHERE user_id = current_user_id;
  DELETE FROM public.welcome_email_queue WHERE user_id = current_user_id;
  
  -- Delete profile (this should cascade to auth.users due to foreign key)
  DELETE FROM public.profiles WHERE user_id = current_user_id;
  
  -- Log the deletion
  PERFORM public.log_security_event(current_user_id, 'account_deleted', '{}'::jsonb);
END;
$$;