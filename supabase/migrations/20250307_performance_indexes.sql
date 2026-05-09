-- Run this in your Supabase SQL Editor to instantly speed up database queries by creating Indexes!

-- Speeds up Attendance lookups and calculations for specific users
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_date ON public.attendance_records(user_id, date);

-- Speeds up fetching users list ordered by join date in Admin panel
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Speeds up any email specific lookups for recovery/verifications
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Speeds up any admin login verification
CREATE INDEX IF NOT EXISTS idx_admin_creds ON public.admin_credentials(username, password);
