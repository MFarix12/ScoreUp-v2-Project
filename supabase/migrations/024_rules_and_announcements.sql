-- =========================================================
-- SCOREUP
-- Competition Rules + Public Announcements
-- =========================================================

create table if not exists public.competition_rules (
  id uuid primary key default gen_random_uuid(),
  games_edition_id uuid not null references public.games_editions(id) on delete cascade,
  sport_id uuid references public.sports(id) on delete cascade,
  competition_id uuid references public.competitions(id) on delete cascade,
  title text not null,
  content text not null,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_rules_title_not_blank check (length(btrim(title)) > 0),
  constraint competition_rules_content_not_blank check (length(btrim(content)) > 0)
);

create index if not exists competition_rules_edition_idx
  on public.competition_rules (games_edition_id, is_published, sort_order, created_at);

create index if not exists competition_rules_sport_idx
  on public.competition_rules (sport_id)
  where sport_id is not null;

create index if not exists competition_rules_competition_idx
  on public.competition_rules (competition_id)
  where competition_id is not null;

alter table public.competition_rules enable row level security;

drop policy if exists "published rules public read" on public.competition_rules;
create policy "published rules public read"
on public.competition_rules
for select
to anon, authenticated
using (is_published = true or public.is_current_user_admin());

drop policy if exists "rules admin insert" on public.competition_rules;
create policy "rules admin insert"
on public.competition_rules
for insert
to authenticated
with check (public.is_current_user_admin());

drop policy if exists "rules admin update" on public.competition_rules;
create policy "rules admin update"
on public.competition_rules
for update
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "rules admin delete" on public.competition_rules;
create policy "rules admin delete"
on public.competition_rules
for delete
to authenticated
using (public.is_current_user_admin());

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  games_edition_id uuid not null references public.games_editions(id) on delete cascade,
  title text not null,
  body text not null,
  priority text not null default 'normal',
  is_published boolean not null default false,
  published_at timestamptz,
  starts_at timestamptz,
  expires_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_title_not_blank check (length(btrim(title)) > 0),
  constraint announcements_body_not_blank check (length(btrim(body)) > 0),
  constraint announcements_priority_check check (priority in ('normal', 'important', 'urgent')),
  constraint announcements_date_window_check check (
    expires_at is null or starts_at is null or expires_at > starts_at
  )
);

create index if not exists announcements_public_idx
  on public.announcements (games_edition_id, is_published, priority, published_at, created_at);

alter table public.announcements enable row level security;

drop policy if exists "published announcements public read" on public.announcements;
create policy "published announcements public read"
on public.announcements
for select
to anon, authenticated
using (is_published = true or public.is_current_user_admin());

drop policy if exists "announcements admin insert" on public.announcements;
create policy "announcements admin insert"
on public.announcements
for insert
to authenticated
with check (public.is_current_user_admin());

drop policy if exists "announcements admin update" on public.announcements;
create policy "announcements admin update"
on public.announcements
for update
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "announcements admin delete" on public.announcements;
create policy "announcements admin delete"
on public.announcements
for delete
to authenticated
using (public.is_current_user_admin());

comment on table public.competition_rules is
  'Admin-managed rules/information scoped to an edition and optionally to a sport or competition.';

comment on table public.announcements is
  'Edition-scoped public announcements with priority and optional display windows.';
