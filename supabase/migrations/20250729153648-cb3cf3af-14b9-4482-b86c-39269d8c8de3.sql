-- Remove admin role from all users first
DELETE FROM public.user_roles WHERE role = 'admin';

-- Add admin role only to the correct email
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::app_role
FROM auth.users au
WHERE au.email = 'marshallgould303030@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;