-- Create the missing app_role enum type that the system expects
CREATE TYPE IF NOT EXISTS app_role AS ENUM ('user', 'admin');