-- Add missing current_position column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_position TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS graduation_year TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spoken_languages TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
