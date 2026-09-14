-- =========================================================
-- SCOREUP
-- MEDAL TALLY ENGINE
--
-- Medal data is derived from official competition placements.
-- No manually editable medal totals are stored.
--
-- 1st = Gold
-- 2nd = Silver
-- 3rd = Bronze
--
-- Only competitions marked as medal events and completed are
-- included in the medal table.
-- =========================================================

create or replace view public.medal_award_details
with (security_invoker = true)
as
select
  cp.id as placement_id,
  ge.id as games_edition_id,
  ge.name as games_edition_name,
  s.id as sport_id,
  s.name as sport_name,
  c.id as competition_id,
  c.name as competition_name,
  c.code as competition_code,
  c.category as competition_category,
  c.status as competition_status,
  c.is_medal_event,
  cp.competition_participant_id,
  t.id as team_id,
  t.name as team_name,
  t.code as team_code,
  t.logo_url as team_logo_url,
  cp.position,
  case cp.position
    when 1 then 'gold'
    when 2 then 'silver'
    when 3 then 'bronze'
    else null
  end as medal_type,
  cp.source_match_id,
  cp.source_result_id
from public.competition_placements cp
join public.competition_participants participant
  on participant.id = cp.competition_participant_id
join public.teams t
  on t.id = participant.team_id
join public.competitions c
  on c.id = cp.competition_id
join public.sports s
  on s.id = c.sport_id
join public.games_editions ge
  on ge.id = s.games_edition_id
where cp.position in (1, 2, 3)
  and c.is_medal_event = true
  and c.status = 'completed';

comment on view public.medal_award_details is
  'Derived medal awards from completed medal-event competition placements.';

create or replace view public.medal_standings
with (security_invoker = true)
as
select
  ge.id as games_edition_id,
  ge.name as games_edition_name,
  t.id as team_id,
  t.name as team_name,
  t.code as team_code,
  t.logo_url as team_logo_url,
  count(*) filter (where cp.position = 1)::integer as gold,
  count(*) filter (where cp.position = 2)::integer as silver,
  count(*) filter (where cp.position = 3)::integer as bronze,
  count(*)::integer as total_medals
from public.competition_placements cp
join public.competition_participants participant
  on participant.id = cp.competition_participant_id
join public.teams t
  on t.id = participant.team_id
join public.competitions c
  on c.id = cp.competition_id
join public.sports s
  on s.id = c.sport_id
join public.games_editions ge
  on ge.id = s.games_edition_id
where cp.position in (1, 2, 3)
  and c.is_medal_event = true
  and c.status = 'completed'
group by
  ge.id,
  ge.name,
  t.id,
  t.name,
  t.code,
  t.logo_url;

comment on view public.medal_standings is
  'Overall team medal totals by games edition, derived from official competition placements.';

revoke all on public.medal_award_details from public;
revoke all on public.medal_standings from public;

grant select on public.medal_award_details to anon, authenticated;
grant select on public.medal_standings to anon, authenticated;
