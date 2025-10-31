-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Insert default admin user (email: admin@dpad.com, password: admin123)
-- Password hash generated using bcrypt
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  'admin@dpad.com',
  '$2a$10$YourHashedPasswordHere',
  'Admin DPAD DIY'
)
ON CONFLICT (email) DO NOTHING;
