-- Create a new storage bucket for events
insert into storage.buckets (id, name, public)
values ('events', 'events', true)
on conflict (id) do nothing;

-- Allow public access to view event banners
create policy "Allow public viewing of event banners"
on storage.objects for select
using ( bucket_id = 'events' );

-- Allow authenticated users to upload event banners
create policy "Allow authenticated users to upload event banners"
on storage.objects for insert
with check (
  bucket_id = 'events' 
  and auth.role() = 'authenticated'
);

-- Allow users to delete their own uploads (optional but good practice)
create policy "Allow users to delete their own event banners"
on storage.objects for delete
using (
  bucket_id = 'events'
  and auth.uid() = owner
);
