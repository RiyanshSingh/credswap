-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE (Extends Auth)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  college text,
  branch text,
  semester text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NOTES TABLE
create table notes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  subject text not null,
  author text not null, -- Can be linked to profiles later
  downloads integer default 0,
  rating numeric(3, 1) default 0.0,
  semester text,
  type text check (type in ('notes', 'pyq')) default 'notes',
  file_url text, -- URL to storage
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EVENTS TABLE
create table events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  date text not null, -- Storing as text for simplicity based on mock data, better as date
  time text not null,
  venue text not null,
  organizer text not null,
  attendees integer default 0,
  category text not null,
  is_featured boolean default false,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TASKS TABLE
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  reward integer not null,
  deadline text not null,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')),
  type text check (type in ('Online', 'Offline')),
  completions integer default 0,
  max_completions integer default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- JOINS (Many-to-Many for User <-> Events/Tasks/Downloads could go here, skipping for MVP)

-- RLS POLICIES
alter table profiles enable row level security;
alter table notes enable row level security;
alter table events enable row level security;
alter table tasks enable row level security;

-- Public Read Policies
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Notes are viewable by everyone" on notes for select using (true);
create policy "Events are viewable by everyone" on events for select using (true);
create policy "Tasks are viewable by everyone" on tasks for select using (true);

-- User Update Policies
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SEED DATA (Optional: Insert some initial data to match mockData)
insert into notes (title, subject, author, downloads, rating, semester, type)
values 
('Data Structures & Algorithms Complete Notes', 'Computer Science', 'Priya Sharma', 2450, 4.8, 'Sem 3', 'notes'),
('Engineering Mathematics III', 'Mathematics', 'Rahul Verma', 1890, 4.6, 'Sem 3', 'notes'),
('DBMS Previous Year Questions 2020-2024', 'Computer Science', 'Vikram Singh', 3200, 4.9, 'Sem 4', 'pyq');

insert into events (title, date, time, venue, organizer, attendees, category, is_featured)
values
('TechFest 2025 - Annual Tech Festival', '25 Jan', '10:00 AM', 'Main Auditorium, BITS Pilani', 'Tech Club', 450, 'Festival', true),
('Workshop: AI & Machine Learning', '18 Jan', '2:00 PM', 'Computer Lab 3', 'AI Society', 120, 'Workshop', false);

insert into tasks (title, description, reward, deadline, difficulty, type, completions, max_completions)
values
('Campus Ambassador Program', 'Represent StudyHub at your college', 500, 'Ongoing', 'Easy', 'Offline', 45, 100),
('Content Review Task', 'Review and verify uploaded notes', 150, '2 days left', 'Medium', 'Online', 12, 20);
