import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

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

type CompetitionGroup = {
  id: string;
  name: string;
  code: string | null;
  sequence_number: number;
  qualification_slots: number | null;

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

export default async function AdminStandingsPage() {
  await requireAdmin();

  const supabase = await createClient();

  // =====================================================
  // LOAD GROUPS
  // =====================================================

  const {
    data: groups,
    error: groupsError,
  } = await supabase
    .from("competition_groups")
    .select(`
      id,
      name,
      code,
      sequence_number,
      qualification_slots,

      competition_stages (
        id,
        name,

        competitions (
          id,
          name,

          sports (
            id,
            name
          )
        )
      )
    `)
    .order("sequence_number", {
      ascending: true,
    });

  if (groupsError) {
    throw new Error(
      `Failed to load competition groups: ${groupsError.message}`
    );
  }

  // =====================================================
  // LOAD STANDINGS
  // =====================================================

  const {
    data: standings,
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

      competition_participants (
        id,

        teams (
          id,
          name
        )
      )
    `)
    .order("position", {
      ascending: true,
      nullsFirst: false,
    });

  if (standingsError) {
    throw new Error(
      `Failed to load group standings: ${standingsError.message}`
    );
  }

  const typedGroups =
    (groups ?? []) as CompetitionGroup[];

  const typedStandings =
    (standings ?? []) as StandingRow[];

  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (typedGroups.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader />

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-black text-[#E30613]">
            S
          </div>

          <h2 className="mt-4 text-lg font-bold text-[#111827]">
            No Group Stages Found
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Generate a tournament with a group stage first.
            ScoreUp will then display standings here after
            official group results are approved.
          </p>

          <Link
            href="/admin/tournaments"
            className="mt-6 inline-flex rounded-xl bg-[#E30613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B0000C]"
          >
            Go to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader />

      <div className="space-y-8">
        {typedGroups.map((group) => {
          const groupStandings =
            typedStandings
              .filter(
                (standing) =>
                  standing.group_id === group.id
              )
              .sort((a, b) => {
                const positionA =
                  a.position ?? 999;

                const positionB =
                  b.position ?? 999;

                return positionA - positionB;
              });

          const hasTieBreak =
            groupStandings.some(
              (standing) =>
                standing.tie_break_required
            );

          return (
            <section
              key={group.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {/* =========================================
                  GROUP HEADER
              ========================================= */}

              <div className="border-b border-slate-200 bg-[#111827] px-6 py-5 text-white">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                        {group.code ??
                          `Group ${group.sequence_number}`}
                      </span>

                      {group.qualification_slots ? (
                        <span className="rounded-full bg-[#E30613] px-3 py-1 text-xs font-semibold text-white">
                          Top {group.qualification_slots} qualify
                        </span>
                      ) : null}
                    </div>

                    <h2 className="text-xl font-bold">
                      {group.name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-300">
                      {
                        group
                          .competition_stages
                          ?.competitions
                          ?.sports
                          ?.name
                      }
                      {" · "}
                      {
                        group
                          .competition_stages
                          ?.competitions
                          ?.name
                      }
                    </p>
                  </div>

                  <div className="text-sm text-slate-300">
                    {
                      groupStandings.length
                    }{" "}
                    team
                    {groupStandings.length === 1
                      ? ""
                      : "s"}
                  </div>
                </div>
              </div>

              {/* =========================================
                  TIE BREAK WARNING
              ========================================= */}

              {hasTieBreak ? (
                <div className="border-b border-amber-200 bg-amber-50 px-6 py-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Tie-break review required
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    Two or more teams are still tied after
                    points, goal difference, and goals scored.
                    Do not finalize qualification until the
                    remaining official tie-break criteria have
                    been resolved.
                  </p>
                </div>
              ) : null}

              {/* =========================================
                  TABLE
              ========================================= */}

              {groupStandings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-[#F5F6F8]">
                        <TableHead className="w-16 text-center">
                          Pos
                        </TableHead>

                        <TableHead>
                          Team
                        </TableHead>

                        <TableHead className="text-center">
                          P
                        </TableHead>

                        <TableHead className="text-center">
                          W
                        </TableHead>

                        <TableHead className="text-center">
                          D
                        </TableHead>

                        <TableHead className="text-center">
                          L
                        </TableHead>

                        <TableHead className="text-center">
                          GF
                        </TableHead>

                        <TableHead className="text-center">
                          GA
                        </TableHead>

                        <TableHead className="text-center">
                          GD
                        </TableHead>

                        <TableHead className="text-center">
                          Pts
                        </TableHead>

                        <TableHead className="text-center">
                          Status
                        </TableHead>
                      </tr>
                    </thead>

                    <tbody>
                      {groupStandings.map(
                        (standing) => {
                          const qualificationSlots =
                            group.qualification_slots ??
                            0;

                          const currentlyInQualificationPosition =
                            standing.position !==
                              null &&
                            standing.position <=
                              qualificationSlots;

                          return (
                            <tr
                              key={
                                standing.id
                              }
                              className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50"
                            >
                              {/* POSITION */}

                              <TableCell className="text-center">
                                <div
                                  className={[
                                    "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                                    currentlyInQualificationPosition
                                      ? "bg-red-50 text-[#E30613]"
                                      : "bg-slate-100 text-slate-700",
                                  ].join(
                                    " "
                                  )}
                                >
                                  {standing.position ??
                                    "-"}
                                </div>
                              </TableCell>

                              {/* TEAM */}

                              <TableCell>
                                <div>
                                  <p className="font-semibold text-[#111827]">
                                    {standing
                                      .competition_participants
                                      ?.teams
                                      ?.name ??
                                      "Unknown Team"}
                                  </p>

                                  {standing.tie_break_required ? (
                                    <p className="mt-1 text-xs font-medium text-amber-600">
                                      Tie-break required
                                    </p>
                                  ) : null}
                                </div>
                              </TableCell>

                              <StatCell
                                value={
                                  standing.played
                                }
                              />

                              <StatCell
                                value={
                                  standing.wins
                                }
                              />

                              <StatCell
                                value={
                                  standing.draws
                                }
                              />

                              <StatCell
                                value={
                                  standing.losses
                                }
                              />

                              <StatCell
                                value={
                                  standing.goals_for
                                }
                              />

                              <StatCell
                                value={
                                  standing.goals_against
                                }
                              />

                              <TableCell className="text-center font-semibold text-[#111827]">
                                {standing.goal_difference >
                                0
                                  ? `+${standing.goal_difference}`
                                  : standing.goal_difference}
                              </TableCell>

                              <TableCell className="text-center">
                                <span className="text-base font-black text-[#111827]">
                                  {
                                    standing.points
                                  }
                                </span>
                              </TableCell>

                              <TableCell className="text-center">
                                {standing.is_qualified ? (
                                  <StatusBadge type="qualified">
                                    Qualified
                                  </StatusBadge>
                                ) : currentlyInQualificationPosition ? (
                                  <StatusBadge type="position">
                                    Qualification Position
                                  </StatusBadge>
                                ) : (
                                  <StatusBadge type="pending">
                                    Pending
                                  </StatusBadge>
                                )}
                              </TableCell>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-10 text-center">
                  <p className="font-semibold text-[#111827]">
                    No standings data yet
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Approve an official result for
                    this group to calculate the
                    standings.
                  </p>
                </div>
              )}

              {/* =========================================
                  LEGEND
              ========================================= */}

              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span>
                    <strong className="text-[#111827]">
                      P
                    </strong>{" "}
                    Played
                  </span>

                  <span>
                    <strong className="text-[#111827]">
                      W
                    </strong>{" "}
                    Won
                  </span>

                  <span>
                    <strong className="text-[#111827]">
                      D
                    </strong>{" "}
                    Drawn
                  </span>

                  <span>
                    <strong className="text-[#111827]">
                      L
                    </strong>{" "}
                    Lost
                  </span>

                  <span>
                    <strong className="text-[#111827]">
                      GF
                    </strong>{" "}
                    Goals For
                  </span>

                  <span>
                    <strong className="text-[#111827]">
                      GA
                    </strong>{" "}
                    Goals Against
                  </span>

                  <span>
                    <strong className="text-[#111827]">
                      GD
                    </strong>{" "}
                    Goal Difference
                  </span>

                  <span>
                    <strong className="text-[#111827]">
                      Pts
                    </strong>{" "}
                    Points
                  </span>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================
// PAGE HEADER
// =========================================================

function PageHeader() {
  return (
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <div className="mb-3 h-1 w-12 rounded-full bg-[#E30613]" />

        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
          Group Standings
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          View automatically calculated standings from
          official group-stage results.
        </p>
      </div>

      <Link
        href="/admin/tournaments"
        className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] transition hover:border-[#E30613] hover:text-[#E30613]"
      >
        View Tournaments
      </Link>
    </div>
  );
}

// =========================================================
// TABLE COMPONENTS
// =========================================================

function TableHead({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 ${className}`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`whitespace-nowrap px-4 py-4 text-sm text-slate-600 ${className}`}
    >
      {children}
    </td>
  );
}

function StatCell({
  value,
}: {
  value: number;
}) {
  return (
    <TableCell className="text-center">
      {value}
    </TableCell>
  );
}

// =========================================================
// STATUS BADGE
// =========================================================

function StatusBadge({
  children,
  type,
}: {
  children: React.ReactNode;
  type:
    | "qualified"
    | "position"
    | "pending";
}) {
  const className =
    type === "qualified"
      ? "bg-emerald-50 text-emerald-700"
      : type === "position"
        ? "bg-red-50 text-[#E30613]"
        : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}