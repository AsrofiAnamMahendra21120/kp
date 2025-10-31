-- Create attendances table to store attendance records
CREATE TABLE IF NOT EXISTS public.attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  division_id UUID NOT NULL REFERENCES public.divisions(id),
  campus_id UUID NOT NULL REFERENCES public.campuses(id),
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_out_time TIMESTAMP WITH TIME ZONE NULL,
  check_in_latitude DECIMAL(10, 8) NOT NULL,
  check_in_longitude DECIMAL(11, 8) NOT NULL,
  check_out_latitude DECIMAL(10, 8) NULL,
  check_out_longitude DECIMAL(11, 8) NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendances_division_id ON public.attendances(division_id);
CREATE INDEX IF NOT EXISTS idx_attendances_campus_id ON public.attendances(campus_id);
CREATE INDEX IF NOT EXISTS idx_attendances_check_in_time ON public.attendances(check_in_time);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON public.attendances(DATE(check_in_time));
