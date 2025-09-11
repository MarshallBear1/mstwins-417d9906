-- Rollback: Remove the profile_discovery view that was recreated
DROP VIEW IF EXISTS public.profile_discovery;

-- Remove the comment
COMMENT ON VIEW public.profile_discovery IS NULL;