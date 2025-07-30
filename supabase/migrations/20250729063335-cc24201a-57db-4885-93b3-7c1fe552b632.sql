-- Create the app_role enum type
CREATE TYPE app_role AS ENUM ('user', 'admin', 'moderator');

-- Grant the admin role to the user marshallgould303030@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('87ef4016-f3d5-424c-9f7d-144b5c72a8d3', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;