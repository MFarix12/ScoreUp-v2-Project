-- =========================================================
-- SCOREUP
-- Team Logo Management
-- =========================================================

alter table public.teams
  add column if not exists logo_path text,
  add column if not exists logo_url text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'team-logos',
  'team-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public visitors need to read team logos.
drop policy if exists "team logos public read" on storage.objects;
create policy "team logos public read"
on storage.objects
for select
using (bucket_id = 'team-logos');

-- Only ScoreUp administrators may manage team logo files.
drop policy if exists "team logos admin insert" on storage.objects;
create policy "team logos admin insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'team-logos'
  and public.is_current_user_admin()
);

drop policy if exists "team logos admin update" on storage.objects;
create policy "team logos admin update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'team-logos'
  and public.is_current_user_admin()
)
with check (
  bucket_id = 'team-logos'
  and public.is_current_user_admin()
);

drop policy if exists "team logos admin delete" on storage.objects;
create policy "team logos admin delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'team-logos'
  and public.is_current_user_admin()
);

create index if not exists teams_logo_path_idx
  on public.teams (logo_path)
  where logo_path is not null;
