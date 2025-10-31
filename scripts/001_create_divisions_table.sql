-- Create divisions table to store available divisions
CREATE TABLE IF NOT EXISTS public.divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some default divisions
INSERT INTO public.divisions (name) VALUES 
  ('IT Development'),
  ('Marketing'),
  ('Human Resources'),
  ('Finance'),
  ('Operations')
ON CONFLICT (name) DO NOTHING;
