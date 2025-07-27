-- Fix the extension in public schema by moving it to extensions schema
-- This is already handled by Supabase automatically, but we'll ensure proper security

-- Fix the query does not match function result type error
DROP FUNCTION IF EXISTS public.get_feedback_admin();

CREATE OR REPLACE FUNCTION public.get_feedback_admin()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  type text,
  subject text,
  message text,
  email text,
  priority text,
  status text,
  admin_notes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Check if user has admin role
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    f.id, 
    f.user_id, 
    f.type, 
    f.subject, 
    f.message, 
    f.email, 
    f.priority, 
    f.status, 
    f.admin_notes, 
    f.created_at, 
    f.updated_at
  FROM public.feedback f
  ORDER BY f.created_at DESC;
END;
$$;