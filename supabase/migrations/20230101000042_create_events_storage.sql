-- Create a new storage bucket for events
insert into storage.buckets (id, name, public)
values ('events', 'events'
on conflict (id) do nothing;

-- Allow public access to view event banners
DROP POLICY IF EXISTS "Allow public viewing of event banners" ON storage.objects;
CREATE POLICY "Allow public viewing of event banners" ON storage.objects for select
using ( bucket_id = 'events' );

-- Allow authenticated users to upload event banners
DROP POLICY IF EXISTS "Allow authenticated users to upload event banners" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload event banners" ON storage.objects for insert
with check (
  bucket_id = 'events' 
  and auth.role() = 'authenticated'
);

-- Allow users to delete their own uploads (optional but good practice)
DROP POLICY IF EXISTS "Allow users to delete their own event banners" ON storage.objects;
CREATE POLICY "Allow users to delete their own event banners" ON storage.objects for delete
using (
  bucket_id = 'events'
  and auth.uid() = owner
);
