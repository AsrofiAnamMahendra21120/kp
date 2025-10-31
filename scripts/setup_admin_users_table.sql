-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin if it doesn't exist
INSERT INTO admin_users (email, password, name, is_active)
VALUES ('admin@dpad.com', 'admin123', 'Admin DPAD DIY', true)
ON CONFLICT (email) DO NOTHING;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
