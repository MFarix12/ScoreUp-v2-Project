import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { StaffPageHeader } from "@/components/staff/staff-page-header";
import { StaffStatCard } from "@/components/staff/staff-stat-card";
import { StaffPanel } from "@/components/staff/staff-panel";
import { StaffLinkButton } from "@/components/staff/staff-button";
import { StaffStatusBadge } from "@/components/staff/staff-status-badge";

export default async function TechnicianDashboardPage() {
  const supabase = await createClient();

  /* =========================================================
     CURRENT USER
  ========================================================= */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(`
      id,
      full_name,
      email,
      status
    `)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-black text-[#111827]">
          Technician profile not found
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Your authentication account is not linked to a ScoreUp
          user profile.
        </p>
      </div>
    );
  }

  /* =========================================================
     TECHNICIAN ASSIGNMENTS
  ========================================================= */

  const { data: assignments } = await supabase
    .from("technician_assignments")
    .select(`
      id,
      games_edition_id,
      sport_id,
      competition_id,

      competitions (
        id,
        name,
        status,

        sports (
          id,
          name
        )
      ),

      sports (
        id,
        name
      ),

      games_editions (
        id,
        name,
        year
      )
    `)
    .eq("user_profile_id", profile.id);

  const assignmentList = assignments ?? [];

  const competitionIds = assignmentList
    .map((assignment: any) => assignment.competition_id)
    .filter(Boolean);

  const sportIds = assignmentList
    .map((assignment: any) => assignment.sport_id)
    .filter(Boolean);

  /* =========================================================
     ASSIGNED MATCHES
  ========================================================= */

  let assignedMatches: any[] = [];

  if (competitionIds.length > 0) {
    const { data } = await supabase
      .from("matches")
      .select(`
        id,
        match_code,
        status,
        competition_id,

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
        ),

        match_schedules (
          id,
          scheduled_start,
          scheduled_end,
          schedule_status,
          is_current,
          venues (
            id,
            name
          )
        ),

        match_results (
          id,
          result_status,
          home_score,
          away_score,
          official_at
        )
      `)
      .in("competition_id", competitionIds)
      .order("created_at", {
        ascending: false,
      });

    assignedMatches = data ?? [];
  } else if (sportIds.length > 0) {
    const { data: competitions } = await supabase
      .from("competitions")
      .select("id")
      .in("sport_id", sportIds);

    const ids =
      competitions?.map((competition) => competition.id) ?? [];

    if (ids.length > 0) {
      const { data } = await supabase
        .from("matches")
        .select(`
          id,
          match_code,
          status,
          competition_id,

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
          ),

          match_schedules (
            id,
            scheduled_start,
            scheduled_end,
            schedule_status,
            is_current,
            venues (
              id,
              name
            )
          ),

          match_results (
            id,
            result_status,
            home_score,
            away_score,
            official_at
          )
        `)
        .in("competition_id", ids);

      assignedMatches = data ?? [];
    }
  }

  /* =========================================================
     NORMALIZE MATCHES
  ========================================================= */

  const normalizedMatches = assignedMatches.map((match: any) => {
    const currentSchedule =
      match.match_schedules?.find(
        (schedule: any) => schedule.is_current
      ) ?? null;

    const latestResult =
      Array.isArray(match.match_results) &&
      match.match_results.length > 0
        ? match.match_results[match.match_results.length - 1]
        : null;

    return {
      ...match,
      currentSchedule,
      latestResult,
    };
  });

  const upcomingMatches = normalizedMatches
    .filter((match: any) => {
      if (!match.currentSchedule?.scheduled_start) {
        return false;
      }

      if (match.latestResult?.result_status === "official") {
        return false;
      }

      const date = new Date(
        match.currentSchedule.scheduled_start
      );

      return date.getTime() >= Date.now();
    })
    .sort(
      (a: any, b: any) =>
        new Date(
          a.currentSchedule.scheduled_start
        ).getTime() -
        new Date(
          b.currentSchedule.scheduled_start
        ).getTime()
    );

  const pendingSubmissionMatches =
    normalizedMatches.filter((match: any) => {
      if (match.latestResult) {
        return false;
      }

      return (
        match.status === "completed" ||
        match.status === "in_progress"
      );
    });

  const submittedResults =
    normalizedMatches.filter(
      (match: any) =>
        match.latestResult?.result_status ===
        "pending_validation"
    );

  const officialResults =
    normalizedMatches.filter(
      (match: any) =>
        match.latestResult?.result_status ===
        "official"
    );

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <StaffPageHeader
        eyebrow="Sports Technician"
        title={`Welcome${
          profile.full_name
            ? `, ${profile.full_name}`
            : ""
        }`}
        description="Manage your assigned matches, submit competition results and track validation status."
        action={
          <StaffLinkButton href="/technician/matches">
            View Assigned Matches
          </StaffLinkButton>
        }
      />

      {/* =====================================================
          TECHNICIAN HERO
      ===================================================== */}

      <section className="relative overflow-hidden rounded-3xl bg-[#111827] p-6 text-white shadow-lg sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#E30613]/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-28 left-1/4 h-56 w-56 rounded-full bg-[#B0000C]/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-red-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#E30613]" />
              Technician Workspace
            </span>

            <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
              Match operations made simple.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Record results only for matches assigned to your
              competition scope. Submitted results will be sent
              to the administrator for validation before they
              become official.
            </p>
          </div>

          <div className="grid min-w-[260px] grid-cols-2 gap-3">
            <HeroMetric
              label="Assignments"
              value={assignmentList.length}
            />

            <HeroMetric
              label="Upcoming"
              value={upcomingMatches.length}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaffStatCard
          label="Assigned Matches"
          value={normalizedMatches.length}
          description="Matches in your scope"
          icon="M"
        />

        <StaffStatCard
          label="Upcoming"
          value={upcomingMatches.length}
          description="Scheduled matches"
          icon="U"
        />

        <StaffStatCard
          label="Pending Validation"
          value={submittedResults.length}
          description="Submitted results"
          icon="P"
        />

        <StaffStatCard
          label="Official Results"
          value={officialResults.length}
          description="Validated by Admin"
          icon="✓"
        />
      </div>

      {/* =====================================================
          ACTION REQUIRED
      ===================================================== */}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <StaffPanel
          title="Matches Requiring Result"
          description="Completed matches in your assignment that do not yet have a submitted result."
          action={
            <StaffLinkButton
              href="/technician/matches"
              variant="secondary"
            >
              All Matches
            </StaffLinkButton>
          }
        >
          {pendingSubmissionMatches.length > 0 ? (
            <div className="space-y-3">
              {pendingSubmissionMatches
                .slice(0, 5)
                .map((match: any) => (
                  <ActionMatchCard
                    key={match.id}
                    match={match}
                  />
                ))}
            </div>
          ) : (
            <DashboardEmptyState
              icon="✓"
              title="No results require submission"
              description="Matches that require a result will appear here after the match is ready for result entry."
            />
          )}
        </StaffPanel>

        {/* ===================================================
            ASSIGNMENTS
        =================================================== */}

        <StaffPanel
          title="My Assignments"
          description="Competition scopes assigned to your technician account."
        >
          {assignmentList.length > 0 ? (
            <div className="space-y-3">
              {assignmentList.map(
                (assignment: any) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                  />
                )
              )}
            </div>
          ) : (
            <DashboardEmptyState
              icon="A"
              title="No active assignment"
              description="An administrator must assign a sport or competition before you can manage match results."
            />
          )}
        </StaffPanel>
      </div>

      {/* =====================================================
          UPCOMING MATCHES
      ===================================================== */}

      <StaffPanel
        title="Upcoming Assigned Matches"
        description="Your next scheduled competition matches."
        action={
          <StaffLinkButton
            href="/technician/matches"
            variant="secondary"
          >
            View Schedule
          </StaffLinkButton>
        }
      >
        {upcomingMatches.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {upcomingMatches
              .slice(0, 6)
              .map((match: any) => (
                <UpcomingMatchCard
                  key={match.id}
                  match={match}
                />
              ))}
          </div>
        ) : (
          <DashboardEmptyState
            icon="M"
            title="No upcoming assigned matches"
            description="Future confirmed match schedules will appear here."
          />
        )}
      </StaffPanel>

      {/* =====================================================
          RECENT SUBMISSIONS
      ===================================================== */}

      <StaffPanel
        title="Submitted Results"
        description="Track the current validation status of results you have submitted."
        action={
          <StaffLinkButton
            href="/technician/results"
            variant="secondary"
          >
            Result History
          </StaffLinkButton>
        }
      >
        {submittedResults.length > 0 ? (
          <div className="space-y-3">
            {submittedResults
              .slice(0, 5)
              .map((match: any) => (
                <SubmittedResultCard
                  key={match.id}
                  match={match}
                />
              ))}
          </div>
        ) : (
          <DashboardEmptyState
            icon="R"
            title="No results awaiting validation"
            description="Results submitted to the administrator will appear here until they are validated."
          />
        )}
      </StaffPanel>
    </div>
  );
}

/* =========================================================
   HERO METRIC
========================================================= */

function HeroMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
      <p className="text-2xl font-black text-white">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

/* =========================================================
   ASSIGNMENT CARD
========================================================= */

function AssignmentCard({
  assignment,
}: {
  assignment: any;
}) {
  const competition =
    assignment.competitions;

  const sport =
    competition?.sports ??
    assignment.sports;

  const edition =
    assignment.games_editions;

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-black text-[#E30613]">
          S
        </div>

        <div className="min-w-0">
          <p className="font-black text-[#111827]">
            {competition?.name ??
              sport?.name ??
              "Assigned Competition"}
          </p>

          {competition && sport && (
            <p className="mt-1 text-xs font-medium text-slate-500">
              {sport.name}
            </p>
          )}

          {edition && (
            <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              {edition.name} {edition.year}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ACTION MATCH CARD
========================================================= */

function ActionMatchCard({
  match,
}: {
  match: any;
}) {
  const home =
    match.home?.teams?.name ?? "TBD";

  const away =
    match.away?.teams?.name ?? "TBD";

  return (
    <div className="rounded-2xl border border-slate-200 p-4 transition hover:border-red-200">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#E30613]">
              {match.match_code ?? "Match"}
            </span>

            <StaffStatusBadge
              status="pending"
              label="Result Required"
            />
          </div>

          <p className="mt-2 font-black text-[#111827]">
            {home}
            <span className="mx-2 text-xs text-slate-300">
              VS
            </span>
            {away}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {match.competitions?.name ??
              "Competition"}
          </p>
        </div>

        <Link
          href={`/technician/matches/${match.id}`}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#E30613] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#B0000C]"
        >
          Enter Result →
        </Link>
      </div>
    </div>
  );
}

/* =========================================================
   UPCOMING MATCH
========================================================= */

function UpcomingMatchCard({
  match,
}: {
  match: any;
}) {
  const schedule =
    match.currentSchedule;

  const home =
    match.home?.teams?.name ?? "TBD";

  const away =
    match.away?.teams?.name ?? "TBD";

  return (
    <Link
      href={`/technician/matches/${match.id}`}
      className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#E30613]">
            {match.match_code ?? "Match"}
          </span>

          <p className="mt-1 text-xs font-medium text-slate-400">
            {match.competitions?.name ??
              "Competition"}
          </p>
        </div>

        <StaffStatusBadge status="confirmed" />
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <p className="text-sm font-black text-[#111827]">
            {home}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111827] text-[9px] font-black text-white">
          VS
        </div>

        <div className="text-right">
          <p className="text-sm font-black text-[#111827]">
            {away}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs font-bold text-[#111827]">
            {formatDate(
              schedule.scheduled_start
            )}
          </p>

          <p className="mt-1 text-xs font-black text-[#E30613]">
            {formatTime(
              schedule.scheduled_start
            )}
          </p>
        </div>

        <p className="text-xs font-medium text-slate-500">
          {schedule.venues?.name ??
            "Venue TBA"}
        </p>
      </div>
    </Link>
  );
}

/* =========================================================
   SUBMITTED RESULT
========================================================= */

function SubmittedResultCard({
  match,
}: {
  match: any;
}) {
  const result =
    match.latestResult;

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#E30613]">
              {match.match_code ??
                "Match"}
            </span>

            <StaffStatusBadge
              status="pending"
              label="Pending Validation"
            />
          </div>

          <p className="mt-2 text-sm font-black text-[#111827]">
            {match.home?.teams?.name ??
              "TBD"}{" "}
            vs{" "}
            {match.away?.teams?.name ??
              "TBD"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {match.competitions?.name ??
              "Competition"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-50 px-4 py-2 text-center">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Score
            </p>

            <p className="mt-1 text-xl font-black text-[#111827]">
              {result?.home_score ?? "-"}
              <span className="mx-2 text-slate-300">
                :
              </span>
              {result?.away_score ?? "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
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
   DATE HELPERS
========================================================= */

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}