-- 1. Create the 'notes' bucket (if not exists via dashboard)
-- Note: It is often better to create buckets via the Dashboard > Storage > New Bucket
-- Name: notes
-- Public: YES (Checked)

-- OR run this directly:
insert into storage.buckets (id, name, public)
values ('notes', 'notes', true)
on conflict (id) do nothing;

-- 2. Security Policies (RLS)

-- Allow uploads: Authenticated users can upload to 'notes'
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'notes' );

-- Allow viewing: Everyone can view/download files
create policy "Allow public view"
on storage.objects for select
to public
using ( bucket_id = 'notes' );

-- Allow users to update/delete their own files (Optional but good)
create policy "Users can update own files"
on storage.objects for update
to authenticated
using ( auth.uid() = owner )
with check ( bucket_id = 'notes' );

create policy "Users can delete own files"
on storage.objects for delete
to authenticated
using ( auth.uid() = owner )
and ( bucket_id = 'notes' );
