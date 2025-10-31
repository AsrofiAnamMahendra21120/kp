-- Create attendances table for tracking check-in and check-out
CREATE TABLE IF NOT EXISTS attendances (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    division_id INTEGER REFERENCES divisions(id),
    campus_id INTEGER REFERENCES campuses(id),
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_in_latitude DECIMAL(10, 8),
    check_in_longitude DECIMAL(11, 8),
    check_out_latitude DECIMAL(10, 8),
    check_out_longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(DATE(check_in_time));
CREATE INDEX IF NOT EXISTS idx_attendances_division ON attendances(division_id);
CREATE INDEX IF NOT EXISTS idx_attendances_campus ON attendances(campus_id);

-- Insert sample data if tables are empty
INSERT INTO divisions (name) VALUES 
    ('IT Development'),
    ('Marketing'),
    ('Human Resources'),
    ('Finance')
ON CONFLICT (name) DO NOTHING;

INSERT INTO campuses (name) VALUES 
    ('Universitas Indonesia'),
    ('Institut Teknologi Bandung'),
    ('Universitas Gadjah Mada'),
    ('Institut Teknologi Sepuluh Nopember')
ON CONFLICT (name) DO NOTHING;

INSERT INTO office_locations (name, latitude, longitude, radius, is_active) VALUES 
    ('Kantor Pusat Jakarta', -6.2088, 106.8456, 100, true)
ON CONFLICT (name) DO NOTHING;
