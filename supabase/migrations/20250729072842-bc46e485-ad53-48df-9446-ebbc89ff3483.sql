-- Remove unused indexes identified by Supabase linter

-- Drop unused index on admin_sessions
DROP INDEX IF EXISTS public.idx_admin_sessions_user_id;

-- Drop unused index on messages for moderation_flag_id
DROP INDEX IF EXISTS public.idx_messages_moderation_flag_id;

-- Drop unused index on profiles for moderation_flag_id
DROP INDEX IF EXISTS public.idx_profiles_moderation_flag_id;

-- Drop unused indexes on user_reports
DROP INDEX IF EXISTS public.idx_user_reports_reported_user_id;
DROP INDEX IF EXISTS public.idx_user_reports_reporter_id;