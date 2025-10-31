-- Create attendances table for storing check-in/check-out records
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    division_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_in_latitude DECIMAL(10, 8) NOT NULL,
    check_in_longitude DECIMAL(11, 8) NOT NULL,
    check_out_latitude DECIMAL(10, 8),
    check_out_longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendances_division_id ON public.attendances(division_id);
CREATE INDEX IF NOT EXISTS idx_attendances_campus_id ON public.attendances(campus_id);
CREATE INDEX IF NOT EXISTS idx_attendances_check_in_time ON public.attendances(check_in_time);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON public.attendances(DATE(check_in_time));

-- Add some sample data for testing
INSERT INTO public.divisions (id, name, created_at) VALUES 
    (gen_random_uuid(), 'IT Development', NOW()),
    (gen_random_uuid(), 'Marketing', NOW()),
    (gen_random_uuid(), 'Human Resources', NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.campuses (id, name, created_at) VALUES 
    (gen_random_uuid(), 'Universitas Indonesia', NOW()),
    (gen_random_uuid(), 'Institut Teknologi Bandung', NOW()),
    (gen_random_uuid(), 'Universitas Gadjah Mada', NOW())
ON CONFLICT (name) DO NOTHING;

-- Add default office location (Jakarta coordinates)
INSERT INTO public.office_locations (name, latitude, longitude, radius, is_active, created_at, updated_at) VALUES 
    ('Kantor Pusat Jakarta', -6.2088, 106.8456, 100, true, NOW(), NOW())
ON CONFLICT DO NOTHING;
