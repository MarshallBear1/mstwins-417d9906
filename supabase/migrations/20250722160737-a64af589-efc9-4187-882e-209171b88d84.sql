-- Create a public function to get user count that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_user_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COUNT(*) FROM public.profiles;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.get_user_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_count() TO authenticated;