-- Create the missing attendances table
CREATE TABLE IF NOT EXISTS public.attendances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    division_id uuid REFERENCES public.divisions(id) ON DELETE CASCADE,
    campus_id uuid REFERENCES public.campuses(id) ON DELETE CASCADE,
    check_in_time timestamp with time zone DEFAULT now(),
    check_out_time timestamp with time zone,
    check_in_latitude numeric,
    check_in_longitude numeric,
    check_out_latitude numeric,
    check_out_longitude numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendances_division_id ON public.attendances(division_id);
CREATE INDEX IF NOT EXISTS idx_attendances_campus_id ON public.attendances(campus_id);
CREATE INDEX IF NOT EXISTS idx_attendances_check_in_time ON public.attendances(check_in_time);
CREATE INDEX IF NOT EXISTS idx_attendances_created_at ON public.attendances(created_at);

-- Add some sample data if tables are empty
INSERT INTO public.divisions (id, name, created_at) 
SELECT gen_random_uuid(), 'IT Development', now()
WHERE NOT EXISTS (SELECT 1 FROM public.divisions WHERE name = 'IT Development');

INSERT INTO public.divisions (id, name, created_at) 
SELECT gen_random_uuid(), 'Marketing', now()
WHERE NOT EXISTS (SELECT 1 FROM public.divisions WHERE name = 'Marketing');

INSERT INTO public.divisions (id, name, created_at) 
SELECT gen_random_uuid(), 'Human Resources', now()
WHERE NOT EXISTS (SELECT 1 FROM public.divisions WHERE name = 'Human Resources');

INSERT INTO public.campuses (id, name, created_at) 
SELECT gen_random_uuid(), 'Universitas Indonesia', now()
WHERE NOT EXISTS (SELECT 1 FROM public.campuses WHERE name = 'Universitas Indonesia');

INSERT INTO public.campuses (id, name, created_at) 
SELECT gen_random_uuid(), 'Institut Teknologi Bandung', now()
WHERE NOT EXISTS (SELECT 1 FROM public.campuses WHERE name = 'Institut Teknologi Bandung');

INSERT INTO public.campuses (id, name, created_at) 
SELECT gen_random_uuid(), 'Universitas Gadjah Mada', now()
WHERE NOT EXISTS (SELECT 1 FROM public.campuses WHERE name = 'Universitas Gadjah Mada');

-- Add default office location if none exists
INSERT INTO public.office_locations (name, latitude, longitude, radius, is_active, created_at, updated_at)
SELECT 'Kantor Pusat Jakarta', -6.2088, 106.8456, 100, true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.office_locations WHERE name = 'Kantor Pusat Jakarta');
