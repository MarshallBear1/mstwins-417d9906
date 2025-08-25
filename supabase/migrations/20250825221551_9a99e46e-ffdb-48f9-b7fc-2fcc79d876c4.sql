-- Fix RLS policies to secure public data access
-- Remove public access to forum likes and comment likes

-- Update forum_likes RLS policies to require authentication
DROP POLICY IF EXISTS "Anyone can view forum likes" ON forum_likes;
CREATE POLICY "Authenticated users can view forum likes" 
ON forum_likes 
FOR SELECT 
TO authenticated
USING (true);

-- Update forum_comment_likes RLS policies to require authentication  
DROP POLICY IF EXISTS "Anyone can view forum comment likes" ON forum_comment_likes;
CREATE POLICY "Authenticated users can view forum comment likes"
ON forum_comment_likes
FOR SELECT 
TO authenticated  
USING (true);

-- Fix database function search paths for security
ALTER FUNCTION public.update_forum_post_like_count() SET search_path = 'public';
ALTER FUNCTION public.enhanced_rate_limit_check(uuid, text, integer, interval) SET search_path = 'public';
ALTER FUNCTION public.enhanced_like_trigger() SET search_path = 'public';
ALTER FUNCTION public.update_forum_post_comment_count() SET search_path = 'public';
ALTER FUNCTION public.enhanced_message_trigger() SET search_path = 'public';
ALTER FUNCTION public.enhanced_profile_trigger() SET search_path = 'public';
ALTER FUNCTION public.validate_admin_session(uuid) SET search_path = 'public';
ALTER FUNCTION public.create_admin_session() SET search_path = 'public';
ALTER FUNCTION public.revoke_admin_session(uuid) SET search_path = 'public';
ALTER FUNCTION public.validate_password_strength(text) SET search_path = 'public';
ALTER FUNCTION public.get_user_count() SET search_path = 'public';
ALTER FUNCTION public.check_login_rate_limit(text, inet) SET search_path = 'public';
ALTER FUNCTION public.log_failed_login_attempt(text, inet, text) SET search_path = 'public';
ALTER FUNCTION public.clear_failed_login_attempts(text) SET search_path = 'public';
ALTER FUNCTION public.get_api_version() SET search_path = 'public';
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = 'public';
ALTER FUNCTION public.authenticate_admin_user() SET search_path = 'public';
ALTER FUNCTION public.update_feedback_admin(uuid, text, text) SET search_path = 'public';
ALTER FUNCTION public.is_current_user_admin() SET search_path = 'public';
ALTER FUNCTION public.validate_and_refresh_admin_session(uuid) SET search_path = 'public';
ALTER FUNCTION public.update_forum_comment_like_count() SET search_path = 'public';
ALTER FUNCTION public.get_feedback_admin() SET search_path = 'public';
ALTER FUNCTION public.delete_user_account() SET search_path = 'public';
ALTER FUNCTION public.log_admin_action(text, jsonb) SET search_path = 'public';
ALTER FUNCTION public.claim_referral_bonus() SET search_path = 'public';
ALTER FUNCTION public.trigger_email_queue_processing() SET search_path = 'public';
ALTER FUNCTION public.get_security_setting(text) SET search_path = 'public';
ALTER FUNCTION public.update_security_config(text, jsonb, text) SET search_path = 'public';
ALTER FUNCTION public.get_user_email_by_id(uuid) SET search_path = 'public';
ALTER FUNCTION public.validate_admin_input_security(jsonb, text) SET search_path = 'public';
ALTER FUNCTION public.enhanced_validate_admin_session(uuid) SET search_path = 'public';
ALTER FUNCTION public.check_admin_rate_limit(uuid, text, interval, integer) SET search_path = 'public';
ALTER FUNCTION public.send_announcement_email(text, text, text, text) SET search_path = 'public';
ALTER FUNCTION public.create_message_notification() SET search_path = 'public';
ALTER FUNCTION public.get_users_needing_re_engagement() SET search_path = 'public';
ALTER FUNCTION public.enhanced_log_admin_action(text, jsonb, text) SET search_path = 'public';
ALTER FUNCTION public.log_push_notification_result(uuid, text, text, text, jsonb) SET search_path = 'public';

-- Move extensions from public schema to extensions schema (if they exist)
-- This is a recommended security practice but needs to be done carefully
-- Most extensions should be in the extensions schema, not public

-- Log the security improvements
INSERT INTO security_audit_log (event_type, event_details) 
VALUES ('security_hardening_applied', jsonb_build_object(
  'improvements', ARRAY[
    'removed_public_forum_access',
    'fixed_function_search_paths', 
    'enhanced_data_protection'
  ],
  'timestamp', now(),
  'severity', 'high'
));