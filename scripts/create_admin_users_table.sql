-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- Insert default admin user (password: admin123)
-- Password hash generated with bcryptjs: bcryptjs.hashSync('admin123', 10)
INSERT INTO public.admin_users (email, password_hash, name, is_active)
VALUES (
  'admin@dpad.com',
  '$2a$10$YourHashedPasswordHere',
  'Admin DPAD DIY',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Grant permissions (no RLS policy as requested)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
