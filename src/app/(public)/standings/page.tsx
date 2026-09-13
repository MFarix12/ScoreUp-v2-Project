import { createClient } from "@/lib/supabase/server";

import {
  PublicEmptyState,
} from "@/components/public/public-empty-state";

// =========================================================
// TYPES
// =========================================================

type StandingRow = {
  id: string;
  group_id: string;
  competition_participant_id: string;
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
    } | null;
  } | null;
};


type PlacementRow = {
  id: string;
  position: number;
  competition_id: string;
  competition_participant_id: string;
  source_match_id: string | null;
  source_result_id: string | null;

  competition_participants: {
    id: string;
    teams: {
      id: string;
      name: string;
    } | null;
  } | null;

  matches: {
    id: string;
    match_code: string | null;
  } | null;
};

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

        games_editions: {
          id: string;
          name: string;
          is_public: boolean;
        } | null;
      } | null;
    } | null;
  } | null;
};

// =========================================================
// HELPERS
// =========================================================

function getGoalDifference(value: number) {
  return value > 0 ? `+${value}` : value.toString();
}

function getTeamInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

// =========================================================
// PAGE
// =========================================================

export default async function StandingsPage() {
  const supabase = await createClient();

  // =====================================================
  // 1. LOAD PUBLIC GROUPS
  // =====================================================

  const {
    data: groupsData,
    error: groupsError,
  } = await supabase
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

            games_editions!inner (
              id,
              name,
              is_public
            )
          )
        )
      )
    `)
    .eq(
      "competition_stages.competitions.sports.games_editions.is_public",
      true
    )
    .order("sequence_number", {
      ascending: true,
    });

  if (groupsError) {
    console.error(
      "Public standings groups error:",
      groupsError
    );
  }

  const groups =
    (groupsData ?? []) as unknown as GroupRow[];

  // =====================================================
  // 2. LOAD PUBLIC GROUP STANDINGS
  // =====================================================

  const groupIds = groups.map(
    (group) => group.id
  );

  let standings: StandingRow[] = [];

  if (groupIds.length > 0) {
    const {
      data: standingsData,
      error: standingsError,
    } = await supabase
      .from("group_standings")
      .select(`
        id,
        group_id,
        competition_participant_id,
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

          teams!inner (
            id,
            name
          )
        )
      `)
      .in("group_id", groupIds);

    if (standingsError) {
      console.error(
        "Public standings data error:",
        standingsError
      );
    }

    standings =
      (standingsData ?? []) as unknown as StandingRow[];
  }

  // =====================================================
  // 3. EMPTY STATE
  // =====================================================

  if (groups.length === 0) {
    return (
      <div className="bg-[#F5F6F8]">
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[34px] border-red-50" />

          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="h-1 w-14 rounded-full bg-[#E30613]" />

            <p className="mt-6 text-xs font-black uppercase tracking-[0.34em] text-[#E30613]">
              SuperUPSI Games
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#111827] sm:text-5xl">
              Group{" "}
              <span className="text-[#E30613]">
                Standings
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
              Follow the latest group standings,
              qualification positions and official
              competition results.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 shadow-sm">
            <PublicEmptyState
              title="No standings available"
              description="Group standings have not been published yet."
            />
          </div>
        </div>
      </div>
    );
  }

  const firstGroup = groups[0];
  const firstStage = firstGroup?.competition_stages;
  const firstCompetition =
    firstStage?.competitions;
  const firstSport =
    firstCompetition?.sports;
  const firstEdition =
    firstSport?.games_editions;

  const totalTeams = standings.length;

  // =====================================================
  // 4. LOAD FINAL COMPETITION PLACEMENTS
  // =====================================================

  let placements: PlacementRow[] = [];

  if (firstCompetition?.id) {
    const {
      data: placementsData,
      error: placementsError,
    } = await supabase
      .from("competition_placements")
      .select(`
        id,
        competition_id,
        position,
        competition_participant_id,
        source_match_id,
        source_result_id,

        competition_participants!inner (
          id,

          teams!inner (
            id,
            name
          )
        ),

        matches (
          id,
          match_code
        )
      `)
      .eq("competition_id", firstCompetition.id)
      .order("position", {
        ascending: true,
      });

    if (placementsError) {
      console.error(
        "Public competition placements error:",
        placementsError
      );
    }

    placements =
      (placementsData ?? []) as unknown as PlacementRow[];
  }

  const champion =
    placements.find(
      (placement) => placement.position === 1
    ) ?? null;

  const runnerUp =
    placements.find(
      (placement) => placement.position === 2
    ) ?? null;

  const thirdPlace =
    placements.find(
      (placement) => placement.position === 3
    ) ?? null;

  const fourthPlace =
    placements.find(
      (placement) => placement.position === 4
    ) ?? null;

  const tournamentCompleted =
    Boolean(
      champion &&
        runnerUp &&
        thirdPlace &&
        fourthPlace
    );

  // =====================================================
  // 5. PAGE
  // =====================================================

  return (
    <div className="bg-[#F5F6F8] pb-14">
      {/* ================================================= */}
      {/* HERO */}
      {/* ================================================= */}

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] overflow-hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#7f1018]" />
          <div className="absolute -left-14 top-1/2 h-72 w-72 -translate-y-1/2 rotate-45 border-[34px] border-white/10" />
          <div className="absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full border-[42px] border-white/5" />

          <div className="absolute bottom-8 right-12 text-right">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-white/55">
              Unity · Sports · Excellence
            </p>

            <p className="mt-2 text-3xl font-black italic text-white">
              More Than A Game
            </p>

            <div className="ml-auto mt-4 h-1 w-20 rounded-full bg-[#E30613]" />
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <div className="h-1 w-14 rounded-full bg-[#E30613]" />

            <p className="mt-6 text-xs font-black uppercase tracking-[0.34em] text-[#E30613]">
              {firstEdition?.name ??
                "SuperUPSI Games"}
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#111827] sm:text-5xl lg:text-6xl">
              Group{" "}
              <span className="text-[#E30613]">
                Standings
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-500">
              Follow the latest group standings,
              qualification positions and official
              match results for{" "}
              <span className="font-semibold text-[#111827]">
                {firstCompetition?.name ??
                  "the competition"}
              </span>
              .
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {firstSport?.name && (
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">
                  {firstSport.name}
                </span>
              )}

              <span className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-[#E30613]">
                {totalTeams} Teams
              </span>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
                Live Standings
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* FINAL PODIUM / PLACEMENTS */}
      {/* ================================================= */}

      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#E30613]">
              Final Placements
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#111827]">
              Tournament{" "}
              <span className="text-[#E30613]">
                Podium
              </span>
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Official final placements are generated automatically
              from the validated Final and Third Place results.
            </p>
          </div>

          <div
            className={
              tournamentCompleted
                ? "inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700"
                : "inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-700"
            }
          >
            {tournamentCompleted
              ? "Tournament Complete"
              : "Awaiting Final Results"}
          </div>
        </div>

        {tournamentCompleted ? (
          <div className="grid gap-5 lg:grid-cols-4">
            {[
              {
                placement: champion,
                label: "Champion",
                medal: "🥇",
                position: "1st",
                cardClass:
                  "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white",
                badgeClass:
                  "bg-amber-400 text-[#111827]",
                iconClass:
                  "bg-amber-100",
              },
              {
                placement: runnerUp,
                label: "Runner-Up",
                medal: "🥈",
                position: "2nd",
                cardClass:
                  "border-slate-200 bg-gradient-to-br from-slate-100 via-white to-white",
                badgeClass:
                  "bg-slate-300 text-[#111827]",
                iconClass:
                  "bg-slate-100",
              },
              {
                placement: thirdPlace,
                label: "Third Place",
                medal: "🥉",
                position: "3rd",
                cardClass:
                  "border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white",
                badgeClass:
                  "bg-orange-300 text-[#111827]",
                iconClass:
                  "bg-orange-100",
              },
              {
                placement: fourthPlace,
                label: "Fourth Place",
                medal: "4",
                position: "4th",
                cardClass:
                  "border-slate-200 bg-white",
                badgeClass:
                  "bg-[#111827] text-white",
                iconClass:
                  "bg-slate-100 text-[#111827]",
              },
            ].map((item) => {
              const teamName =
                item.placement
                  ?.competition_participants
                  ?.teams
                  ?.name ?? "Unknown Team";

              return (
                <article
                  key={item.position}
                  className={`relative overflow-hidden rounded-[28px] border p-6 shadow-[0_18px_45px_rgba(15,23,42,0.07)] ${item.cardClass}`}
                >
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border-[16px] border-slate-900/[0.03]" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-sm ${item.iconClass}`}
                      >
                        {item.medal}
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${item.badgeClass}`}
                      >
                        {item.position}
                      </span>
                    </div>

                    <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      {item.label}
                    </p>

                    <h3 className="mt-2 min-h-[56px] text-xl font-black leading-7 text-[#111827]">
                      {teamName}
                    </h3>

                    <div className="mt-5 flex items-center gap-3 border-t border-slate-200/80 pt-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111827] text-[9px] font-black text-white">
                        {getTeamInitials(teamName)}
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Source
                        </p>

                        <p className="mt-0.5 text-xs font-bold text-slate-600">
                          {item.placement?.matches?.match_code ??
                            "Official Result"}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 shadow-sm">
            <PublicEmptyState
              title="Final podium not available yet"
              description="Champion, runner-up, third place and fourth place will appear automatically after the Final and Third Place results are officially validated."
            />
          </div>
        )}
      </section>

      {/* ================================================= */}
      {/* GROUP STANDINGS */}
      {/* ================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-7 xl:grid-cols-2">
          {groups.map((group, groupIndex) => {
            const groupStandings =
              standings
                .filter(
                  (standing) =>
                    standing.group_id ===
                    group.id
                )
                .sort((a, b) => {
                  const positionA =
                    a.position ??
                    Number.MAX_SAFE_INTEGER;

                  const positionB =
                    b.position ??
                    Number.MAX_SAFE_INTEGER;

                  return positionA - positionB;
                });

            const hasTieBreak =
              groupStandings.some(
                (standing) =>
                  standing.tie_break_required
              );

            const isFirstGroup =
              groupIndex % 2 === 0;

            return (
              <article
                key={group.id}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
              >
                <div
                  className={
                    isFirstGroup
                      ? "relative overflow-hidden bg-gradient-to-r from-[#7f0b12] via-[#A70E18] to-[#E30613] px-5 py-5 text-white sm:px-6"
                      : "relative overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#162235] to-[#24334a] px-5 py-5 text-white sm:px-6"
                  }
                >
                  <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[18px] border-white/10" />

                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl shadow-inner ring-1 ring-white/20">
                        🏆
                      </div>

                      <div>
                        <h2 className="text-2xl font-black">
                          {group.name}
                        </h2>

                        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/65">
                          {groupStandings.length} teams ·{" "}
                          {group.qualification_slots} spots
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/15 px-4 py-2 text-center ring-1 ring-white/20 backdrop-blur">
                      <p className="text-xs font-black uppercase tracking-wide">
                        Top{" "}
                        {group.qualification_slots}
                      </p>

                      <p className="text-[11px] text-white/70">
                        Qualify
                      </p>
                    </div>
                  </div>
                </div>

                {groupStandings.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                            <th className="w-16 px-4 py-4 text-center">
                              #
                            </th>
                            <th className="px-4 py-4 text-left">
                              Team
                            </th>
                            <th className="px-3 py-4 text-center">
                              P
                            </th>
                            <th className="px-3 py-4 text-center">
                              W
                            </th>
                            <th className="px-3 py-4 text-center">
                              D
                            </th>
                            <th className="px-3 py-4 text-center">
                              L
                            </th>
                            <th className="px-3 py-4 text-center">
                              GF
                            </th>
                            <th className="px-3 py-4 text-center">
                              GA
                            </th>
                            <th className="px-3 py-4 text-center">
                              GD
                            </th>
                            <th className="px-4 py-4 text-center text-[#E30613]">
                              PTS
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {groupStandings.map(
                            (standing) => {
                              const team =
                                standing
                                  .competition_participants
                                  ?.teams;

                              const teamName =
                                team?.name ??
                                "Unknown Team";

                              const isQualificationPosition =
                                standing.position !==
                                  null &&
                                standing.position <=
                                  group.qualification_slots;

                              return (
                                <tr
                                  key={standing.id}
                                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                                >
                                  <td className="px-4 py-4 text-center">
                                    <span
                                      className={
                                        isQualificationPosition
                                          ? "mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#E30613] text-xs font-black text-white shadow-sm"
                                          : "mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-500"
                                      }
                                    >
                                      {standing.position ??
                                        "-"}
                                    </span>
                                  </td>

                                  <td className="px-4 py-4">
                                    <div className="flex min-w-[230px] items-center gap-3">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#111827] text-[10px] font-black text-white shadow-sm">
                                        {getTeamInitials(
                                          teamName
                                        )}
                                      </div>

                                      <div>
                                        <p className="font-bold leading-5 text-[#111827]">
                                          {teamName}
                                        </p>

                                        <div className="mt-1">
                                          {standing.is_qualified ? (
                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                                              Qualified
                                            </span>
                                          ) : isQualificationPosition ? (
                                            <span className="text-[10px] font-black uppercase tracking-wider text-[#E30613]">
                                              Qualification position
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                              Group stage
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-3 py-4 text-center text-sm font-semibold text-slate-600">
                                    {standing.played}
                                  </td>
                                  <td className="px-3 py-4 text-center text-sm font-semibold text-slate-600">
                                    {standing.wins}
                                  </td>
                                  <td className="px-3 py-4 text-center text-sm font-semibold text-slate-600">
                                    {standing.draws}
                                  </td>
                                  <td className="px-3 py-4 text-center text-sm font-semibold text-slate-600">
                                    {standing.losses}
                                  </td>
                                  <td className="px-3 py-4 text-center text-sm font-semibold text-slate-600">
                                    {standing.goals_for}
                                  </td>
                                  <td className="px-3 py-4 text-center text-sm font-semibold text-slate-600">
                                    {standing.goals_against}
                                  </td>
                                  <td className="px-3 py-4 text-center text-sm font-bold text-slate-700">
                                    {getGoalDifference(
                                      standing.goal_difference
                                    )}
                                  </td>

                                  <td className="px-4 py-4 text-center">
                                    <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-red-50 px-3 text-sm font-black text-[#E30613]">
                                      {standing.points}
                                    </span>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>

                    {hasTieBreak && (
                      <div className="border-t border-amber-100 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800 sm:px-6">
                        <span className="font-bold">
                          Tie-break required:
                        </span>{" "}
                        some teams remain level on
                        the current automatic ranking
                        criteria. Final qualification
                        is not yet confirmed.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8">
                    <PublicEmptyState
                      title={`No standings available for ${group.name}`}
                      description="Standings will appear after official group-stage results are recorded."
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* ================================================= */}
        {/* INFORMATION CARDS */}
        {/* ================================================= */}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-red-100 bg-gradient-to-br from-red-50 to-white p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                🥇
              </div>

              <div>
                <h3 className="font-black text-[#E30613]">
                  Qualification
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The top teams from each group
                  advance to the knockout stage
                  according to the competition
                  format.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                🚩
              </div>

              <div>
                <h3 className="font-black text-[#111827]">
                  Competition Format
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {totalTeams} participating teams
                  are currently shown across{" "}
                  {groups.length} competition groups.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                🤝
              </div>

              <div>
                <h3 className="font-black text-[#111827]">
                  Official Standings
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Rankings update from official
                  match results validated in
                  ScoreUp.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* POINTS SYSTEM */}
        {/* ================================================= */}

        <section className="mt-8 overflow-hidden rounded-[28px] bg-gradient-to-r from-[#111827] via-[#162235] to-[#111827] p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)] sm:p-7">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-red-400">
                Competition Rules
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Points System
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Points are awarded from the
                official group-stage match result.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-2xl">
              <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-center">
                <p className="text-3xl font-black text-red-400">
                  3
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-wider">
                  Win
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Points
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-3xl font-black">
                  1
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-wider">
                  Draw
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Point
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-3xl font-black">
                  0
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-wider">
                  Loss
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Points
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs font-semibold text-slate-500">
          <span>P = Played</span>
          <span>W = Win</span>
          <span>D = Draw</span>
          <span>L = Loss</span>
          <span>GF = Goals For</span>
          <span>GA = Goals Against</span>
          <span>GD = Goal Difference</span>
        </div>
      </section>
    </div>
  );
}
