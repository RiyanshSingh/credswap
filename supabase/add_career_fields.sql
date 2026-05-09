-- Add Career and Social columns to profiles table

alter table profiles 
add column if not exists bio text,
add column if not exists skills text, -- We can store comma-separated values (e.g. "React, Node.js")
add column if not exists linkedin text,
add column if not exists github text,
add column if not exists portfolio text,
add column if not exists resume_link text;

-- No new RLS needed as the existing "update own profile" policy covers all columns.
