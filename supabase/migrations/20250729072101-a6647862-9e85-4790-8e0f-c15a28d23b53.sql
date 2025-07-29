-- Fix RLS policy performance issues by consolidating and optimizing policies

-- Drop problematic duplicate policies first
DROP POLICY IF EXISTS "Admins can manage all moderation flags" ON public.moderation_flags;
DROP POLICY IF EXISTS "View and manage announcements" ON public.robot_announcements;

-- Optimize profiles policy for better performance  
DROP POLICY IF EXISTS "Profile visibility policy" ON public.profiles;
CREATE POLICY "optimized_profile_visibility" ON public.profiles
FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() IS NOT NULL
);

-- Optimize user_roles policy to reduce redundancy
DROP POLICY IF EXISTS "Users can view own roles, admins can manage all roles" ON public.user_roles;
CREATE POLICY "optimized_user_roles_select" ON public.user_roles
FOR SELECT USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Optimize notification policies to reduce checks
DROP POLICY IF EXISTS "Users can create notifications for others" ON public.notifications;
CREATE POLICY "optimized_notifications_insert" ON public.notifications
FOR INSERT WITH CHECK (
  from_user_id IS NULL OR auth.uid() = from_user_id
);

-- Optimize messages policy for better performance
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "optimized_messages_insert" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- Optimize likes policies to reduce complexity
DROP POLICY IF EXISTS "Users can view likes they gave or received" ON public.likes;
CREATE POLICY "optimized_likes_select" ON public.likes
FOR SELECT USING (
  auth.uid() = liker_id OR auth.uid() = liked_id
);

-- Optimize matches policy
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
CREATE POLICY "optimized_matches_select" ON public.matches
FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- Create index for better RLS performance on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_rls ON public.profiles(user_id) WHERE user_id IS NOT NULL;

-- Create index for better performance on likes
CREATE INDEX IF NOT EXISTS idx_likes_performance ON public.likes(liker_id, liked_id);

-- Create index for better performance on matches
CREATE INDEX IF NOT EXISTS idx_matches_performance ON public.matches(user1_id, user2_id);

-- Create index for better performance on messages
CREATE INDEX IF NOT EXISTS idx_messages_performance ON public.messages(sender_id, receiver_id);