-- Create attendance_records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'halfday', 'holiday')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Create attendance_settings table
CREATE TABLE IF NOT EXISTS public.attendance_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    semester_start DATE,
    semester_end DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;

-- Create Policies for attendance_records
CREATE POLICY "Users can manage their own attendance"
    ON public.attendance_records
    FOR ALL USING (auth.uid() = user_id);

-- Create Policies for attendance_settings
CREATE POLICY "Users can manage their own attendance settings"
    ON public.attendance_settings
    FOR ALL USING (auth.uid() = user_id);
