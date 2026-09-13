import {
  Award,
  ShieldCheck,
  Trophy,
} from "lucide-react";

import { PublicEmptyState } from "@/components/public/public-empty-state";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { PublicSportFilter } from "@/components/public/public-sport-filter";
import { TeamLogo } from "@/components/public/team-logo";
import { createClient } from "@/lib/supabase/server";

interface StandingsPageProps {
  searchParams: Promise<{
    sport?: string;
  }>;
}

type GroupRow = {
  id: string;
  name: string;
  code: string | null;
  sequence_number: number;
  qualification_slots: number;
  competition_stages: {
    id: string;
    name: string;
    competitions: {
      id: string;
      name: string;
      sports: {
        id: string;
        name: string;
      } | null;
    } | null;
  } | null;
};

type StandingRow = {
  id: string;
  group_id: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  position: number | null;
  tie_break_required: boolean;
  is_qualified: boolean;
  competition_participants: {
    id: string;
    teams: {
      id: string;
      name: string;
      code: string | null;
    } | null;
  } | null;
};

type PlacementRow = {
  id: string;
  competition_id: string;
  position: number;
  competition_participants: {
    id: string;
    teams: {
      id: string;
      name: string;
      code: string | null;
    } | null;
  } | null;
  competitions: {
    id: string;
    name: string;
    sports: {
      id: string;
      name: string;
    } | null;
  } | null;
};

function gd(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

export default async function StandingsPage({ searchParams }: StandingsPageProps) {
  const { sport } = await searchParams;
  const supabase = await createClient();

  const [groupsResult, placementsResult] = await Promise.all([
    supabase
      .from("competition_groups")
      .select(`
        id,
        name,
        code,
        sequence_number,
        qualification_slots,
        competition_stages!inner (
          id,
          name,
          competitions!inner (
            id,
            name,
            sports!inner (
              id,
              name,
              games_editions!inner (id,is_public)
            )
          )
        )
      `)
      .eq("competition_stages.competitions.sports.games_editions.is_public", true)
      .order("sequence_number", { ascending: true }),

    supabase
      .from("competition_placements")
      .select(`
        id,
        competition_id,
        position,
        competition_participants!inner (
          id,
          teams!inner (id,name,code)
        ),
        competitions!inner (
          id,
          name,
          sports!inner (
            id,
            name,
            games_editions!inner (id,is_public)
          )
        )
      `)
      .eq("competitions.sports.games_editions.is_public", true)
      .in("position", [1, 2, 3, 4]),
  ]);

  if (groupsResult.error) console.error("Public standings groups error:", groupsResult.error);
  if (placementsResult.error) console.error("Public standings placements error:", placementsResult.error);

  const groups = (groupsResult.data ?? []) as unknown as GroupRow[];
  const placements = (placementsResult.data ?? []) as unknown as PlacementRow[];

  const groupIds = groups.map((group) => group.id);
  let standings: StandingRow[] = [];

  if (groupIds.length > 0) {
    const standingsResult = await supabase
      .from("group_standings")
      .select(`
        id,
        group_id,
        played,
        wins,
        draws,
        losses,
        goals_for,
        goals_against,
        goal_difference,
        points,
        position,
        tie_break_required,
        is_qualified,
        competition_participants!inner (
          id,
          teams!inner (id,name,code)
        )
      `)
      .in("group_id", groupIds);

    if (standingsResult.error) console.error("Public standings data error:", standingsResult.error);
    standings = (standingsResult.data ?? []) as unknown as StandingRow[];
  }

  const sportsMap = new Map<string, string>();
  groups.forEach((group) => {
    const s = group.competition_stages?.competitions?.sports;
    if (s?.id && s?.name) sportsMap.set(s.id, s.name);
  });
  placements.forEach((placement) => {
    const s = placement.competitions?.sports;
    if (s?.id && s?.name) sportsMap.set(s.id, s.name);
  });

  const sports = [...sportsMap.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const visibleGroups = sport
    ? groups.filter((group) => group.competition_stages?.competitions?.sports?.id === sport)
    : groups;

  const visiblePlacements = sport
    ? placements.filter((placement) => placement.competitions?.sports?.id === sport)
    : placements;

  const competitionIds = new Set<string>();
  visibleGroups.forEach((group) => {
    const id = group.competition_stages?.competitions?.id;
    if (id) competitionIds.add(id);
  });
  visiblePlacements.forEach((placement) => competitionIds.add(placement.competition_id));

  return (
    <>
      <PublicPageHeader
        eyebrow="Competition Tables"
        title="Standings"
        description="Follow current rankings, group performance, qualification positions and final tournament placements by sport."
      />

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E30613]">Choose Sport</p>
              <p className="mt-1 text-sm text-slate-500">View the relevant standings and progression for each competition.</p>
            </div>
            <PublicSportFilter sports={sports} selectedSport={sport} basePath="/standings" />
          </div>
        </div>

        {competitionIds.size === 0 ? (
          <div className="mt-8">
            <PublicEmptyState title="No standings available" description="Standings will appear after competition data has been published." icon="T" />
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            {[...competitionIds].map((competitionId) => {
              const competitionGroups = visibleGroups.filter(
                (group) => group.competition_stages?.competitions?.id === competitionId
              );
              const competitionPlacements = visiblePlacements
                .filter((placement) => placement.competition_id === competitionId)
                .sort((a, b) => a.position - b.position);

              const competition =
                competitionGroups[0]?.competition_stages?.competitions ??
                competitionPlacements[0]?.competitions;

              return (
                <section key={competitionId}>
                  <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E30613]">
                        {competition?.sports?.name ?? "Sport"}
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-[#111827]">{competition?.name ?? "Competition"}</h2>
                    </div>
                    {competitionPlacements.length > 0 && (
                      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        <ShieldCheck className="h-4 w-4" /> Final placements available
                      </span>
                    )}
                  </div>

                  {competitionPlacements.length > 0 && (
                    <PlacementStrip placements={competitionPlacements} />
                  )}

                  {competitionGroups.length > 0 && (
                    <div className={`grid gap-5 ${competitionGroups.length > 1 ? "xl:grid-cols-2" : ""} ${competitionPlacements.length > 0 ? "mt-6" : ""}`}>
                      {competitionGroups.map((group) => {
                        const rows = standings
                          .filter((row) => row.group_id === group.id)
                          .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

                        return <GroupTable key={group.id} group={group} rows={rows} />;
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function PlacementStrip({ placements }: { placements: PlacementRow[] }) {
  const labels: Record<number, string> = {
    1: "Champion",
    2: "Runner-Up",
    3: "Third Place",
    4: "Fourth Place",
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {placements.map((placement) => {
        const team = placement.competition_participants?.teams;
        return (
          <div key={placement.id} className={`rounded-2xl border p-4 ${placement.position === 1 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center gap-3">
              <TeamLogo name={team?.name ?? "Team"} code={team?.code} />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">{labels[placement.position] ?? `#${placement.position}`}</p>
                <p className="mt-1 truncate text-sm font-black text-[#111827]">{team?.name ?? "Team"}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroupTable({ group, rows }: { group: GroupRow; rows: StandingRow[] }) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#E30613]">Group Stage</p>
          <h3 className="mt-1 text-lg font-black text-[#111827]">{group.name}</h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#E30613]">
          <Trophy className="h-5 w-5" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-3 py-3 text-center">P</th>
              <th className="px-3 py-3 text-center">W</th>
              <th className="px-3 py-3 text-center">D</th>
              <th className="px-3 py-3 text-center">L</th>
              <th className="px-3 py-3 text-center">GD</th>
              <th className="px-3 py-3 text-center">Pts</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const team = row.competition_participants?.teams;
              const inQualificationPosition =
                row.position !== null && row.position <= group.qualification_slots;

              return (
                <tr key={row.id} className={inQualificationPosition ? "bg-emerald-50/40" : ""}>
                  <td className="px-4 py-3.5 font-black text-slate-400">{row.position ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <TeamLogo name={team?.name ?? "Team"} code={team?.code} size="sm" />
                      <div>
                        <p className="font-black text-[#111827]">{team?.name ?? "Team"}</p>
                        {team?.code && <p className="text-xs font-bold text-slate-400">{team.code}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center">{row.played}</td>
                  <td className="px-3 py-3.5 text-center">{row.wins}</td>
                  <td className="px-3 py-3.5 text-center">{row.draws}</td>
                  <td className="px-3 py-3.5 text-center">{row.losses}</td>
                  <td className="px-3 py-3.5 text-center font-bold">{gd(row.goal_difference)}</td>
                  <td className="px-3 py-3.5 text-center text-base font-black text-[#111827]">{row.points}</td>
                  <td className="px-4 py-3.5 text-right">
                    {row.tie_break_required ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">Tie-break</span>
                    ) : row.is_qualified ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Qualified</span>
                    ) : inQualificationPosition ? (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">Qualification</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">No standings have been calculated yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
        <Award className="h-4 w-4 text-[#E30613]" />
        Top {group.qualification_slots} position{group.qualification_slots === 1 ? "" : "s"} qualify when official tie-breaks are resolved.
      </div>
    </div>
  );
}
