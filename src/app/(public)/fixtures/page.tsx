import Link from "next/link";

import { PublicEmptyState } from "@/components/public/public-empty-state";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { createClient } from "@/lib/supabase/server";

export default async function PublicFixturesPage() {
  const supabase = await createClient();

  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      id,
      match_code,
      status,
      is_published,

      competitions (
        id,
        name,

        sports (
          id,
          name
        )
      ),

      round:tournament_rounds (
        id,
        name
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
        is_published,

        venues (
          id,
          name,
          code
        )
      ),

      match_results (
        id,
        home_score,
        away_score,
        result_status,
        is_published,
        official_at
      )
    `)
    .eq("is_published", true)
    .order("match_code", {
      ascending: true,
    });

  if (error) {
    console.error("Public fixtures error:", error);
  }

  const visibleMatches = (matches ?? []).map((match) => {
    const currentSchedule =
      match.match_schedules?.find(
        (schedule: any) =>
          schedule.is_current === true &&
          schedule.is_published === true &&
          ["confirmed", "postponed"].includes(
            schedule.schedule_status
          )
      ) ?? null;

    const officialResult =
      match.match_results?.find(
        (result: any) =>
          result.result_status === "official" &&
          result.is_published === true
      ) ?? null;

    return {
      ...match,
      currentSchedule,
      officialResult,
    };
  });

  const upcomingMatches = visibleMatches.filter(
    (match) =>
      !match.officialResult &&
      match.currentSchedule &&
      match.currentSchedule.schedule_status === "confirmed"
  );

  const postponedMatches = visibleMatches.filter(
    (match) =>
      !match.officialResult &&
      match.currentSchedule?.schedule_status === "postponed"
  );

  const completedMatches = visibleMatches.filter(
    (match) => match.officialResult
  );

  const tbdMatches = visibleMatches.filter(
    (match) =>
      !match.officialResult &&
      !match.currentSchedule
  );

  return (
    <>
      <PublicPageHeader
        eyebrow="SuperUPSI Games"
        title="Competition Fixtures"
        description="Explore upcoming, completed and pending fixtures across all published SuperUPSI Games competitions."
      />

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FixtureSummaryCard
            label="Upcoming"
            value={upcomingMatches.length}
            description="Confirmed matches"
          />

          <FixtureSummaryCard
            label="Completed"
            value={completedMatches.length}
            description="Official results"
          />

          <FixtureSummaryCard
            label="Postponed"
            value={postponedMatches.length}
            description="Awaiting reschedule"
          />

          <FixtureSummaryCard
            label="TBD"
            value={tbdMatches.length}
            description="Pending schedule"
          />
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E30613]">
              Match Centre
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {visibleMatches.length} published{" "}
              {visibleMatches.length === 1
                ? "fixture"
                : "fixtures"}{" "}
              available.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/schedule"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#111827] transition hover:border-red-200 hover:bg-red-50 hover:text-[#E30613]"
            >
              Schedule
            </Link>

            <Link
              href="/bracket"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#111827] transition hover:border-red-200 hover:bg-red-50 hover:text-[#E30613]"
            >
              Bracket
            </Link>

            <Link
              href="/results"
              className="rounded-xl bg-[#E30613] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B0000C]"
            >
              Results
            </Link>
          </div>
        </div>

        {visibleMatches.length === 0 ? (
          <div className="mt-8">
            <PublicEmptyState
              title="No published fixtures yet"
              description="Competition fixtures will appear here after matches have been generated and published by the administrator."
              icon="F"
            />
          </div>
        ) : (
          <div className="mt-12 space-y-14">
            {/* Upcoming */}
            <FixtureSection
              eyebrow="Next Up"
              title="Upcoming Fixtures"
              description="Confirmed matches that are scheduled to take place next."
              count={upcomingMatches.length}
            >
              {upcomingMatches.length > 0 ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  {upcomingMatches.map((match) => (
                    <FixtureCard
                      key={match.id}
                      match={match}
                      type="upcoming"
                    />
                  ))}
                </div>
              ) : (
                <SectionEmptyState text="There are currently no confirmed upcoming fixtures." />
              )}
            </FixtureSection>

            {/* Completed */}
            <FixtureSection
              eyebrow="Finished"
              title="Completed Fixtures"
              description="Matches with official published results."
              count={completedMatches.length}
            >
              {completedMatches.length > 0 ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  {completedMatches.map((match) => (
                    <FixtureCard
                      key={match.id}
                      match={match}
                      type="completed"
                    />
                  ))}
                </div>
              ) : (
                <SectionEmptyState text="No fixtures have been completed yet." />
              )}
            </FixtureSection>

            {/* Postponed */}
            {postponedMatches.length > 0 && (
              <FixtureSection
                eyebrow="Attention"
                title="Postponed Fixtures"
                description="Published matches that are currently awaiting a new confirmed schedule."
                count={postponedMatches.length}
              >
                <div className="grid gap-5 lg:grid-cols-2">
                  {postponedMatches.map((match) => (
                    <FixtureCard
                      key={match.id}
                      match={match}
                      type="postponed"
                    />
                  ))}
                </div>
              </FixtureSection>
            )}

            {/* TBD */}
            {tbdMatches.length > 0 && (
              <FixtureSection
                eyebrow="Pending"
                title="Schedule To Be Confirmed"
                description="Published fixtures where the participants may be known but the official match time has not yet been published."
                count={tbdMatches.length}
              >
                <div className="grid gap-5 lg:grid-cols-2">
                  {tbdMatches.map((match) => (
                    <FixtureCard
                      key={match.id}
                      match={match}
                      type="tbd"
                    />
                  ))}
                </div>
              </FixtureSection>
            )}
          </div>
        )}
      </section>
    </>
  );
}

function FixtureSummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black tracking-tight text-[#111827]">
            {value}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-sm font-black text-[#E30613]">
          {String(value).padStart(2, "0")}
        </div>
      </div>
    </div>
  );
}

function FixtureSection({
  eyebrow,
  title,
  description,
  count,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-[#E30613]" />

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E30613]">
            {eyebrow}
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
            {title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
          {count} {count === 1 ? "match" : "matches"}
        </span>
      </div>

      {children}
    </section>
  );
}

function FixtureCard({
  match,
  type,
}: {
  match: any;
  type:
    | "upcoming"
    | "completed"
    | "postponed"
    | "tbd";
}) {
  const homeName =
    match.home?.teams?.name ?? "TBD";

  const awayName =
    match.away?.teams?.name ?? "TBD";

  const homeCode =
    match.home?.teams?.code ?? "";

  const awayCode =
    match.away?.teams?.code ?? "";

  const schedule = match.currentSchedule;
  const result = match.officialResult;

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className={`h-1 ${
          type === "postponed"
            ? "bg-amber-400"
            : type === "completed"
            ? "bg-[#111827]"
            : "bg-[#E30613]"
        }`}
      />

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#E30613]">
                {match.match_code ?? "Match"}
              </span>

              {match.round?.name && (
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                  {match.round.name}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              {match.competitions?.sports?.name ??
                "Sport"}
            </p>

            <h3 className="mt-1 text-base font-black text-[#111827]">
              {match.competitions?.name ??
                "Competition"}
            </h3>
          </div>

          <FixtureStatus type={type} />
        </div>

        {/* Teams */}
        <div className="my-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <FixtureTeam
            name={homeName}
            code={homeCode}
            score={
              result
                ? result.home_score
                : undefined
            }
            winner={
              result &&
              result.home_score >
                result.away_score
            }
          />

          <div className="text-center">
            {result ? (
              <span className="rounded-xl bg-[#111827] px-3 py-2 text-[10px] font-black text-white">
                FT
              </span>
            ) : (
              <span className="rounded-xl bg-red-50 px-3 py-2 text-[10px] font-black text-[#E30613]">
                VS
              </span>
            )}
          </div>

          <FixtureTeam
            name={awayName}
            code={awayCode}
            score={
              result
                ? result.away_score
                : undefined
            }
            winner={
              result &&
              result.away_score >
                result.home_score
            }
            align="right"
          />
        </div>

        {/* Schedule */}
        <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Date & Time
            </p>

            <p className="mt-1.5 text-sm font-bold text-[#111827]">
              {schedule?.scheduled_start
                ? `${formatDate(
                    schedule.scheduled_start
                  )} · ${formatTime(
                    schedule.scheduled_start
                  )}`
                : "To Be Confirmed"}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Venue
            </p>

            <p className="mt-1.5 text-sm font-bold text-[#111827]">
              {schedule?.venues?.name ??
                "Venue TBA"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function FixtureTeam({
  name,
  code,
  score,
  winner = false,
  align = "left",
}: {
  name: string;
  code?: string;
  score?: number;
  winner?: boolean;
  align?: "left" | "right";
}) {
  return (
    <div
      className={
        align === "right"
          ? "text-right"
          : "text-left"
      }
    >
      <p
        className={`text-sm font-black sm:text-base ${
          winner
            ? "text-[#111827]"
            : score !== undefined
            ? "text-slate-500"
            : "text-[#111827]"
        }`}
      >
        {name}
      </p>

      {code && (
        <p className="mt-1 text-xs font-semibold text-slate-400">
          {code}
        </p>
      )}

      {score !== undefined && (
        <p
          className={`mt-3 text-4xl font-black ${
            winner
              ? "text-[#E30613]"
              : "text-[#111827]"
          }`}
        >
          {score}
        </p>
      )}
    </div>
  );
}

function FixtureStatus({
  type,
}: {
  type:
    | "upcoming"
    | "completed"
    | "postponed"
    | "tbd";
}) {
  const styles = {
    upcoming:
      "bg-green-50 text-green-700",
    completed:
      "bg-slate-100 text-slate-600",
    postponed:
      "bg-amber-50 text-amber-700",
    tbd:
      "bg-red-50 text-[#E30613]",
  };

  const labels = {
    upcoming: "Upcoming",
    completed: "Completed",
    postponed: "Postponed",
    tbd: "TBD",
  };

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${styles[type]}`}
    >
      {labels[type]}
    </span>
  );
}

function SectionEmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p className="text-sm font-medium text-slate-500">
        {text}
      </p>
    </div>
  );
}

function formatDate(value: string) {
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

function formatTime(value: string) {
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