-- FIX: Allow authenticated users to upload notes
-- We previously only allowed "SELECT" (viewing), but forgot "INSERT" (uploading).

create policy "Authenticated users can create notes"
on notes for insert
to authenticated
with check (true);

-- Ideally, we should also allow them to update/delete their own notes
-- But since our 'notes' table uses 'author' (text) instead of 'user_id' (uuid) yet,
-- we will just enable INSERTS for now to get the feature working.
