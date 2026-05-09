-- OPPORTUNITIES SCHEMA (Internship / Job / Campus Ambassador)

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  company text,
  company_logo text,
  category text,
  type text,
  work_mode text,
  location text,
  industry text,
  duration text,
  stipend_text text,
  stipend_min numeric,
  stipend_max numeric,
  stipend_currency text default 'INR',
  work_hours text,
  employment_type text,
  experience text,
  eligibility text,
  education text,
  required_skills jsonb default '[]'::jsonb,
  branches_allowed jsonb default '[]'::jsonb,
  year_of_study text,
  age_limit text,
  description text,
  introduction text,
  program_overview text,
  domains jsonb default '[]'::jsonb,
  eligibility_criteria jsonb default '[]'::jsonb,
  how_to_apply jsonb default '[]'::jsonb,
  faqs jsonb default '[]'::jsonb,
  apply_by date,
  posted_at date,
  updated_at date,
  valid_through date,
  openings integer,
  open_method text,
  application_fee numeric,
  apply_url text,
  is_paid boolean default false,
  created_at timestamptz default now()
);

alter table public.opportunities enable row level security;

drop policy if exists "Opportunities are viewable by everyone" on public.opportunities;
create policy "Opportunities are viewable by everyone"
  on public.opportunities for select
  using (true);
