import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { StaffPageHeader } from "@/components/staff/staff-page-header";
import { StaffStatCard } from "@/components/staff/staff-stat-card";
import { StaffPanel } from "@/components/staff/staff-panel";
import { StaffLinkButton } from "@/components/staff/staff-button";
import { StaffStatusBadge } from "@/components/staff/staff-status-badge";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  /* =========================================================
     ACTIVE GAMES EDITION
  ========================================================= */

  const { data: activeEdition } = await supabase
    .from("games_editions")
    .select(`
      id,
      name,
      year,
      start_date,
      end_date,
      is_active,
      is_public
    `)
    .eq("is_active", true)
    .maybeSingle();

  /* =========================================================
     DASHBOARD COUNTS
  ========================================================= */

  const [
    sportsResponse,
    teamsResponse,
    competitionsResponse,
    matchesResponse,
    pendingResultsResponse,
  ] = await Promise.all([
    supabase
      .from("sports")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("teams")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("competitions")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("matches")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("match_results")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "result_status",
        "pending_validation"
      ),
  ]);

  const sportsCount =
    sportsResponse.count ?? 0;

  const teamsCount =
    teamsResponse.count ?? 0;

  const competitionsCount =
    competitionsResponse.count ?? 0;

  const matchesCount =
    matchesResponse.count ?? 0;

  const pendingResultsCount =
    pendingResultsResponse.count ?? 0;

  /* =========================================================
     PENDING RESULT VALIDATIONS
  ========================================================= */

  const { data: pendingResults } =
    await supabase
      .from("match_results")
      .select(`
        id,
        home_score,
        away_score,
        submitted_at,
        result_status,

        matches (
          id,
          match_code,

          competitions (
            id,
            name,

            sports (
              id,
              name
            )
          ),

          home:competition_participants!matches_home_participant_fk (
            id,
            teams (
              id,
              name,
              code
            )
          ),

          away:competition_participants!matches_away_participant_fk (
            id,
            teams (
              id,
              name,
              code
            )
          )
        )
      `)
      .eq(
        "result_status",
        "pending_validation"
      )
      .order("submitted_at", {
        ascending: false,
      })
      .limit(5);

  /* =========================================================
     UPCOMING MATCHES
  ========================================================= */

  const { data: upcomingSchedules } =
    await supabase
      .from("match_schedules")
      .select(`
        id,
        scheduled_start,
        schedule_status,

        venues (
          id,
          name,
          code
        ),

        matches (
          id,
          match_code,

          competitions (
            id,
            name,

            sports (
              id,
              name
            )
          ),

          home:competition_participants!matches_home_participant_fk (
            id,
            teams (
              id,
              name,
              code
            )
          ),

          away:competition_participants!matches_away_participant_fk (
            id,
            teams (
              id,
              name,
              code
            )
          )
        )
      `)
      .eq("is_current", true)
      .eq(
        "schedule_status",
        "confirmed"
      )
      .gte(
        "scheduled_start",
        new Date().toISOString()
      )
      .order("scheduled_start", {
        ascending: true,
      })
      .limit(5);

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <StaffPageHeader
        eyebrow="Administration"
        title="ScoreUp Dashboard"
        description="Manage SuperUPSI Games competitions, schedules, tournament progression and official results from one central workspace."
        action={
          <StaffLinkButton href="/admin/competitions">
            Manage Competitions
          </StaffLinkButton>
        }
      />

      {/* =====================================================
          ACTIVE EDITION
      ===================================================== */}

      {activeEdition ? (
        <section className="relative overflow-hidden rounded-3xl bg-[#111827] p-6 text-white shadow-lg sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#E30613]/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-[#B0000C]/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-red-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#E30613]" />
                  Active Games Edition
                </span>

                {activeEdition.is_public ? (
                  <span className="rounded-full bg-green-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-green-300">
                    Public
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300">
                    Private
                  </span>
                )}
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
                {activeEdition.name}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                SuperUPSI Games{" "}
                {activeEdition.year}
              </p>

              <div className="mt-6 flex flex-wrap gap-5 text-sm">
                <EditionInfo
                  label="Start Date"
                  value={formatEditionDate(
                    activeEdition.start_date
                  )}
                />

                <EditionInfo
                  label="End Date"
                  value={formatEditionDate(
                    activeEdition.end_date
                  )}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/editions/${activeEdition.id}/edit`}
                className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Edit Edition
              </Link>

              <Link
                href="/admin/editions"
                className="rounded-xl bg-[#E30613] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B0000C]"
              >
                Games Editions
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-red-200 bg-red-50 p-6 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E30613]">
            Games Edition
          </p>

          <h2 className="mt-2 text-xl font-black text-[#111827]">
            No active Games Edition
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Create or activate a Games Edition before
            configuring competitions, teams and tournament
            fixtures.
          </p>

          <Link
            href="/admin/editions"
            className="mt-5 inline-flex rounded-xl bg-[#E30613] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B0000C]"
          >
            Manage Games Editions
          </Link>
        </section>
      )}

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StaffStatCard
          label="Sports"
          value={sportsCount}
          description="Configured sports"
          icon="S"
        />

        <StaffStatCard
          label="Teams"
          value={teamsCount}
          description="Registered teams"
          icon="T"
        />

        <StaffStatCard
          label="Competitions"
          value={competitionsCount}
          description="Competition events"
          icon="C"
        />

        <StaffStatCard
          label="Matches"
          value={matchesCount}
          description="Generated matches"
          icon="M"
        />

        <StaffStatCard
          label="Pending Results"
          value={pendingResultsCount}
          description="Awaiting validation"
          icon="R"
        />
      </div>

      {/* =====================================================
          MAIN DASHBOARD GRID
      ===================================================== */}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Pending results */}
        <StaffPanel
          title="Pending Result Validation"
          description="Results submitted by Sports Technicians that require administrator approval."
          action={
            <StaffLinkButton
              href="/admin/results"
              variant="secondary"
            >
              View All
            </StaffLinkButton>
          }
        >
          {(pendingResults ?? []).length >
          0 ? (
            <div className="space-y-3">
              {(pendingResults ?? []).map(
                (result: any) => (
                  <PendingResultCard
                    key={result.id}
                    result={result}
                  />
                )
              )}
            </div>
          ) : (
            <DashboardEmptyState
              icon="✓"
              title="Everything is up to date"
              description="There are currently no match results waiting for validation."
            />
          )}
        </StaffPanel>

        {/* Quick actions */}
        <StaffPanel
          title="Quick Actions"
          description="Common administration tasks."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <QuickAction
              href="/admin/competitions"
              number="01"
              title="Manage Competitions"
              description="Create and configure competition events."
            />

            <QuickAction
              href="/admin/tournament"
              number="02"
              title="Tournament Management"
              description="Generate brackets and manage progression."
            />

            <QuickAction
              href="/admin/matches"
              number="03"
              title="Matches & Scheduling"
              description="Review fixtures, venues and match schedules."
            />

            <QuickAction
              href="/admin/results"
              number="04"
              title="Validate Results"
              description="Approve submitted competition results."
            />
          </div>
        </StaffPanel>
      </div>

      {/* =====================================================
          UPCOMING MATCHES
      ===================================================== */}

      <StaffPanel
        title="Upcoming Matches"
        description="The next confirmed matches in the current competition schedule."
        action={
          <StaffLinkButton
            href="/admin/matches"
            variant="secondary"
          >
            All Matches
          </StaffLinkButton>
        }
      >
        {(upcomingSchedules ?? []).length >
        0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <TableHeading>
                    Match
                  </TableHeading>

                  <TableHeading>
                    Competition
                  </TableHeading>

                  <TableHeading>
                    Fixture
                  </TableHeading>

                  <TableHeading>
                    Date & Time
                  </TableHeading>

                  <TableHeading>
                    Venue
                  </TableHeading>

                  <TableHeading>
                    Status
                  </TableHeading>
                </tr>
              </thead>

              <tbody>
                {(upcomingSchedules ?? []).map(
                  (schedule: any) => {
                    const match =
                      schedule.matches;

                    return (
                      <tr
                        key={schedule.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                      >
                        <TableCell>
                          <span className="font-black text-[#E30613]">
                            {match?.match_code ??
                              "Match"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-bold text-[#111827]">
                              {match
                                ?.competitions
                                ?.name ??
                                "Competition"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {match
                                ?.competitions
                                ?.sports
                                ?.name ?? ""}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-semibold text-[#111827]">
                            {match?.home
                              ?.teams?.name ??
                              "TBD"}
                          </span>

                          <span className="mx-2 text-xs font-black text-slate-300">
                            VS
                          </span>

                          <span className="font-semibold text-[#111827]">
                            {match?.away
                              ?.teams?.name ??
                              "TBD"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-bold text-[#111827]">
                              {formatMatchDate(
                                schedule.scheduled_start
                              )}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-[#E30613]">
                              {formatMatchTime(
                                schedule.scheduled_start
                              )}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          {schedule.venues
                            ?.name ??
                            "TBA"}
                        </TableCell>

                        <TableCell>
                          <StaffStatusBadge status="confirmed" />
                        </TableCell>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <DashboardEmptyState
            icon="M"
            title="No upcoming matches"
            description="Confirmed match schedules will appear here once matches have been scheduled."
          />
        )}
      </StaffPanel>
    </div>
  );
}

/* =========================================================
   ACTIVE EDITION INFO
========================================================= */

function EditionInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-white">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   PENDING RESULT
========================================================= */

function PendingResultCard({
  result,
}: {
  result: any;
}) {
  const match = result.matches;

  const home =
    match?.home?.teams?.name ?? "TBD";

  const away =
    match?.away?.teams?.name ?? "TBD";

  return (
    <Link
      href="/admin/results"
      className="block rounded-2xl border border-slate-200 p-4 transition hover:border-red-200 hover:bg-red-50/30"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#E30613]">
              {match?.match_code ??
                "Match"}
            </span>

            <StaffStatusBadge
              status="pending"
              label="Pending Validation"
            />
          </div>

          <p className="mt-2 text-sm font-black text-[#111827]">
            {match?.competitions?.name ??
              "Competition"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {match?.competitions?.sports
              ?.name ?? ""}
          </p>
        </div>

        <div className="grid min-w-[200px] grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div>
            <p className="truncate text-xs font-semibold text-slate-500">
              {home}
            </p>

            <p className="mt-1 text-2xl font-black text-[#111827]">
              {result.home_score}
            </p>
          </div>

          <span className="rounded-lg bg-[#111827] px-2.5 py-1.5 text-[9px] font-black text-white">
            FT
          </span>

          <div className="text-right">
            <p className="truncate text-xs font-semibold text-slate-500">
              {away}
            </p>

            <p className="mt-1 text-2xl font-black text-[#111827]">
              {result.away_score}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  href,
  number,
  title,
  description,
}: {
  href: string;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex gap-4 rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xs font-black text-[#E30613] transition group-hover:bg-[#E30613] group-hover:text-white">
        {number}
      </div>

      <div>
        <p className="text-sm font-black text-[#111827] transition group-hover:text-[#E30613]">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </Link>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function DashboardEmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 font-black text-[#E30613]">
        {icon}
      </div>

      <p className="mt-4 font-black text-[#111827]">
        {title}
      </p>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   TABLE
========================================================= */

function TableHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-4 py-4 text-sm text-slate-600">
      {children}
    </td>
  );
}

/* =========================================================
   DATE HELPERS
========================================================= */

function formatEditionDate(
  value: string | null
) {
  if (!value) {
    return "TBA";
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone: "Asia/Kuala_Lumpur",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(
      `${value}T00:00:00+08:00`
    )
  );
}

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone: "Asia/Kuala_Lumpur",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(value));
}

function formatMatchTime(value: string) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  ).format(new Date(value));
}