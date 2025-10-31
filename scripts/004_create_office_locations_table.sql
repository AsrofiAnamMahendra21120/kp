-- Create office_locations table to store allowed office coordinates
CREATE TABLE IF NOT EXISTS office_locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Jakarta office location
INSERT INTO office_locations (name, latitude, longitude, radius, is_active) 
VALUES ('Kantor Pusat Jakarta', -6.2088, 106.8456, 100, true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_office_locations_active ON office_locations(is_active);
