import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function PublicHomePage() {
  const supabase = await createClient();

  const { data: activeEdition } = await supabase
    .from("games_editions")
    .select(`
      id,
      name,
      year,
      start_date,
      end_date
    `)
    .eq("is_public", true)
    .eq("is_active", true)
    .maybeSingle();

  const { data: latestResults } = await supabase
    .from("match_results")
    .select(`
      id,
      home_score,
      away_score,
      official_at,

      matches (
        id,
        match_code,

        competitions (
          name,

          sports (
            name
          )
        ),

        home:competition_participants!matches_home_participant_fk (
          teams (
            name,
            code
          )
        ),

        away:competition_participants!matches_away_participant_fk (
          teams (
            name,
            code
          )
        )
      )
    `)
    .eq("result_status", "official")
    .eq("is_published", true)
    .order("official_at", {
      ascending: false,
    })
    .limit(4);

  const { data: upcomingSchedules } = await supabase
    .from("match_schedules")
    .select(`
      id,
      scheduled_start,
      scheduled_end,
      schedule_status,

      venues (
        name,
        code
      ),

      matches (
        id,
        match_code,
        is_published,

        competitions (
          name,

          sports (
            name
          )
        ),

        home:competition_participants!matches_home_participant_fk (
          teams (
            name,
            code
          )
        ),

        away:competition_participants!matches_away_participant_fk (
          teams (
            name,
            code
          )
        )
      )
    `)
    .eq("is_current", true)
    .eq("is_published", true)
    .eq("schedule_status", "confirmed")
    .gte("scheduled_start", new Date().toISOString())
    .order("scheduled_start", {
      ascending: true,
    })
    .limit(4);

  const publicUpcomingSchedules =
    (upcomingSchedules ?? []).filter(
      (schedule) =>
        schedule.matches?.is_published === true
    );

  return (
    <>
      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="relative overflow-hidden bg-[#111827] text-white">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-24 h-[420px] w-[420px] rounded-full bg-[#E30613]/20 blur-3xl" />

          <div className="absolute -bottom-32 -left-24 h-[360px] w-[360px] rounded-full bg-[#B0000C]/20 blur-3xl" />

          <div className="absolute right-[10%] top-[15%] h-56 w-56 rotate-12 rounded-[48px] border border-white/5 bg-white/[0.02]" />

          <div className="absolute right-[20%] top-[30%] h-72 w-72 -rotate-12 rounded-[56px] border border-red-500/10 bg-[#E30613]/5" />

          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
          {/* Hero Content */}
          <div className="flex flex-col justify-center">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-200">
                <span className="h-2 w-2 rounded-full bg-[#E30613] shadow-[0_0_12px_rgba(227,6,19,0.9)]" />
                SuperUPSI Games
              </span>

              {activeEdition && (
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300">
                  {activeEdition.year}
                </span>
              )}
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Every match.
              <br />
              Every result.
              <br />
              <span className="text-[#E30613]">
                One ScoreUp.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Follow SuperUPSI Games with official schedules,
              fixtures, tournament brackets and verified match
              results from one centralized platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/schedule"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E30613] px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-red-950/30 transition hover:-translate-y-0.5 hover:bg-[#B0000C]"
              >
                View Schedule
                <span>→</span>
              </Link>

              <Link
                href="/results"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Latest Results
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Official competition data
              </span>

              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Updated schedules
              </span>

              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Public access
              </span>
            </div>
          </div>

          {/* Hero Event Card */}
          <div className="flex items-center lg:justify-end">
            <div className="w-full max-w-lg">
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-2 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[22px] border border-white/5 bg-[#171E2C]/90 p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">
                        Current Event
                      </p>

                      <h2 className="mt-3 text-2xl font-black text-white">
                        {activeEdition?.name ??
                          "SuperUPSI Games"}
                      </h2>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E30613] text-xl font-black text-white shadow-lg shadow-red-950/30">
                      S
                    </div>
                  </div>

                  {activeEdition ? (
                    <>
                      <div className="mt-7 grid grid-cols-2 gap-3">
                        <EventInfo
                          label="Starts"
                          value={formatDate(
                            activeEdition.start_date
                          )}
                        />

                        <EventInfo
                          label="Ends"
                          value={formatDate(
                            activeEdition.end_date
                          )}
                        />
                      </div>

                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-400">
                              Event Status
                            </p>

                            <p className="mt-1 font-bold text-white">
                              Active Competition
                            </p>
                          </div>

                          <span className="inline-flex items-center gap-2 rounded-full bg-green-400/10 px-3 py-1.5 text-xs font-bold text-green-300">
                            <span className="h-2 w-2 rounded-full bg-green-400" />
                            LIVE
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-7 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm leading-6 text-slate-400">
                      No active public Games Edition is currently
                      available.
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <HeroQuickLink
                      href="/schedule"
                      label="Schedule"
                    />

                    <HeroQuickLink
                      href="/bracket"
                      label="Bracket"
                    />

                    <HeroQuickLink
                      href="/results"
                      label="Results"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          QUICK ACCESS
      ===================================================== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAccessCard
              href="/schedule"
              number="01"
              title="Schedule"
              description="Match dates, times and venues."
            />

            <QuickAccessCard
              href="/fixtures"
              number="02"
              title="Fixtures"
              description="Upcoming and completed matches."
            />

            <QuickAccessCard
              href="/bracket"
              number="03"
              title="Bracket"
              description="Follow tournament progression."
            />

            <QuickAccessCard
              href="/results"
              number="04"
              title="Results"
              description="Verified official match results."
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* =====================================================
            UPCOMING MATCHES
        ===================================================== */}
        <section>
          <SectionHeading
            eyebrow="Coming Up"
            title="Upcoming Matches"
            description="The next published matches scheduled for SuperUPSI Games."
            href="/schedule"
            linkText="Full Schedule"
          />

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {publicUpcomingSchedules.map((schedule) => (
              <UpcomingMatchCard
                key={schedule.id}
                schedule={schedule}
              />
            ))}

            {publicUpcomingSchedules.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 font-black text-[#E30613]">
                  S
                </div>

                <h3 className="mt-5 font-black text-[#111827]">
                  No upcoming matches yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Upcoming matches will appear here after the
                  administrator confirms and publishes the
                  schedule.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            LATEST RESULTS
        ===================================================== */}
        <section>
          <SectionHeading
            eyebrow="Official"
            title="Latest Results"
            description="Recently verified and published competition results."
            href="/results"
            linkText="View All Results"
          />

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {(latestResults ?? []).map((result) => (
              <ResultCard
                key={result.id}
                result={result}
              />
            ))}

            {latestResults?.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 font-black text-[#E30613]">
                  R
                </div>

                <h3 className="mt-5 font-black text-[#111827]">
                  No official results yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Results will appear here after they have been
                  submitted, validated and published.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            PUBLIC CTA
        ===================================================== */}
        <section className="relative overflow-hidden rounded-[32px] bg-[#111827] px-6 py-10 text-white shadow-xl sm:px-10 lg:px-12 lg:py-12">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#E30613]/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
                Follow the competition
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Everything you need to follow SuperUPSI Games.
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                Check fixtures, view the tournament bracket and
                stay updated with official results throughout the
                competition.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/fixtures"
                className="rounded-xl bg-[#E30613] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#B0000C]"
              >
                View Fixtures
              </Link>

              <Link
                href="/bracket"
                className="rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10"
              >
                Tournament Bracket
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function EventInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function HeroQuickLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-xs font-bold text-slate-300 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-white"
    >
      {label}
    </Link>
  );
}

function QuickAccessCard({
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
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F5F6F8] text-xs font-black text-[#E30613] transition group-hover:bg-red-50">
        {number}
      </div>

      <div>
        <p className="font-black text-[#111827] transition group-hover:text-[#E30613]">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkText,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  linkText: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <div className="mb-3 h-1 w-10 rounded-full bg-[#E30613]" />

        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E30613]">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827] sm:text-3xl">
          {title}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <Link
        href={href}
        className="w-fit text-sm font-bold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
      >
        {linkText} →
      </Link>
    </div>
  );
}

function UpcomingMatchCard({
  schedule,
}: {
  schedule: any;
}) {
  const match = schedule.matches;

  const home =
    match?.home?.teams?.name ?? "TBD";

  const away =
    match?.away?.teams?.name ?? "TBD";

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="h-1 bg-[#E30613]" />

      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#E30613]">
              {match?.match_code ?? "Match"}
            </p>

            <p className="mt-1 text-sm font-bold text-[#111827]">
              {match?.competitions?.name ??
                "Competition"}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {match?.competitions?.sports?.name ??
                ""}
            </p>
          </div>

          <div className="rounded-xl bg-[#F5F6F8] px-3 py-2 text-right">
            <p className="text-xs font-bold text-[#111827]">
              {formatShortDate(
                schedule.scheduled_start
              )}
            </p>

            <p className="mt-0.5 text-xs font-semibold text-[#E30613]">
              {formatTime(
                schedule.scheduled_start
              )}
            </p>
          </div>
        </div>

        <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div>
            <p className="font-black text-[#111827]">
              {home}
            </p>

            {match?.home?.teams?.code && (
              <p className="mt-1 text-xs text-slate-400">
                {match.home.teams.code}
              </p>
            )}
          </div>

          <span className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-black text-[#E30613]">
            VS
          </span>

          <div className="text-right">
            <p className="font-black text-[#111827]">
              {away}
            </p>

            {match?.away?.teams?.code && (
              <p className="mt-1 text-xs text-slate-400">
                {match.away.teams.code}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-500">
            {schedule.venues?.name ??
              "Venue TBA"}
          </p>

          <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-bold text-green-700">
            Confirmed
          </span>
        </div>
      </div>
    </article>
  );
}

function ResultCard({
  result,
}: {
  result: any;
}) {
  const match = result.matches;

  const home =
    match?.home?.teams?.name ?? "TBD";

  const away =
    match?.away?.teams?.name ?? "TBD";

  const homeWon =
    result.home_score >
    result.away_score;

  const awayWon =
    result.away_score >
    result.home_score;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="border-b border-slate-100 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#E30613]">
              {match?.match_code ?? "Match"}
            </p>

            <p className="mt-1 text-sm font-bold text-[#111827]">
              {match?.competitions?.name ??
                "Competition"}
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
            OFFICIAL
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 p-6">
        <div>
          <p
            className={`font-bold ${
              homeWon
                ? "text-[#111827]"
                : "text-slate-500"
            }`}
          >
            {home}
          </p>

          <p
            className={`mt-3 text-4xl font-black ${
              homeWon
                ? "text-[#E30613]"
                : "text-[#111827]"
            }`}
          >
            {result.home_score}
          </p>
        </div>

        <div className="text-center">
          <span className="rounded-lg bg-[#F5F6F8] px-3 py-2 text-[11px] font-black text-slate-400">
            FT
          </span>
        </div>

        <div className="text-right">
          <p
            className={`font-bold ${
              awayWon
                ? "text-[#111827]"
                : "text-slate-500"
            }`}
          >
            {away}
          </p>

          <p
            className={`mt-3 text-4xl font-black ${
              awayWon
                ? "text-[#E30613]"
                : "text-[#111827]"
            }`}
          >
            {result.away_score}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-3">
        <p className="text-xs font-medium text-slate-400">
          {match?.competitions?.sports?.name ??
            "SuperUPSI Games"}
        </p>
      </div>
    </article>
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
  ).format(new Date(`${value}T00:00:00+08:00`));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone: "Asia/Kuala_Lumpur",
      day: "numeric",
      month: "short",
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