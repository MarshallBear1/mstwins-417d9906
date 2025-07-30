-- Grant admin role to the current user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('87ef4016-f3d5-424c-9f7d-144b5c72a8d3', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;