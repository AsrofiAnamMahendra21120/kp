-- Create campuses table to store available campuses
CREATE TABLE IF NOT EXISTS public.campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some default campuses
INSERT INTO public.campuses (name) VALUES 
  ('Universitas Indonesia'),
  ('Institut Teknologi Bandung'),
  ('Universitas Gadjah Mada'),
  ('Institut Teknologi Sepuluh Nopember'),
  ('Universitas Brawijaya')
ON CONFLICT (name) DO NOTHING;
