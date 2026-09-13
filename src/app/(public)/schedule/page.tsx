import Link from "next/link";

import { PublicEmptyState } from "@/components/public/public-empty-state";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { createClient } from "@/lib/supabase/server";

export default async function PublicSchedulePage() {
  const supabase = await createClient();

  const {
    data: schedules,
    error,
  } = await supabase
    .from("match_schedules")
    .select(`
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
      ),

      matches!inner (
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
        )
      )
    `)
    .eq("is_current", true)
    .eq("is_published", true)
    .in(
      "schedule_status",
      ["confirmed", "postponed"]
    )
    .eq(
      "matches.is_published",
      true
    )
    .order(
      "scheduled_start",
      {
        ascending: true,
      }
    );

  if (error) {
    console.error(
      "Public schedule error:",
      error
    );
  }

  const visibleSchedules =
    schedules ?? [];

  const groupedSchedules =
    groupSchedulesByDate(
      visibleSchedules
    );

  return (
    <>
      <PublicPageHeader
        eyebrow="SuperUPSI Games"
        title="Competition Schedule"
        description="View published match dates, competition times, venues and upcoming fixtures throughout SuperUPSI Games."
      />

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* =================================================
            TOP CONTROLS
        ================================================= */}

        <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E30613]">
              Published Schedule
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {visibleSchedules.length}{" "}
              {visibleSchedules.length === 1
                ? "match"
                : "matches"}{" "}
              currently available.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/fixtures"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#111827] transition hover:border-red-200 hover:bg-red-50 hover:text-[#E30613]"
            >
              View Fixtures
            </Link>

            <Link
              href="/results"
              className="rounded-xl bg-[#E30613] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B0000C]"
            >
              Latest Results
            </Link>
          </div>
        </div>

        {/* =================================================
            SCHEDULE
        ================================================= */}

        {visibleSchedules.length === 0 ? (
          <PublicEmptyState
            title="No published schedules yet"
            description="Match schedules will appear here after they have been confirmed and published by the competition administrator."
            icon="S"
          />
        ) : (
          <div className="space-y-10">
            {Object.entries(
              groupedSchedules
            ).map(
              ([dateKey, items]) => (
                <section key={dateKey}>
                  {/* ======================================
                      DATE HEADER
                  ====================================== */}

                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#111827] text-white shadow-sm">
                      <span className="text-[10px] font-bold uppercase text-red-300">
                        {formatMonth(
                          dateKey
                        )}
                      </span>

                      <span className="text-lg font-black leading-none">
                        {formatDay(
                          dateKey
                        )}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-[#111827] sm:text-xl">
                        {formatFullDate(
                          dateKey
                        )}
                      </h2>

                      <p className="mt-0.5 text-xs font-medium text-slate-400">
                        {items.length}{" "}
                        {items.length === 1
                          ? "match"
                          : "matches"}
                      </p>
                    </div>
                  </div>

                  {/* ======================================
                      MATCH CARDS
                  ====================================== */}

                  <div className="space-y-4">
                    {items.map(
                      (schedule) => (
                        <ScheduleCard
                          key={
                            schedule.id
                          }
                          schedule={
                            schedule
                          }
                        />
                      )
                    )}
                  </div>
                </section>
              )
            )}
          </div>
        )}
      </section>
    </>
  );
}

/* =========================================================
   SCHEDULE CARD
========================================================= */

function ScheduleCard({
  schedule,
}: {
  schedule: any;
}) {
  const match =
    schedule.matches;

  const homeName =
    match?.home?.teams?.name ??
    "TBD";

  const awayName =
    match?.away?.teams?.name ??
    "TBD";

  const homeCode =
    match?.home?.teams?.code ??
    "";

  const awayCode =
    match?.away?.teams?.code ??
    "";

  const postponed =
    schedule.schedule_status ===
    "postponed";

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg">
      <div
        className={`h-1 ${
          postponed
            ? "bg-amber-400"
            : "bg-[#E30613]"
        }`}
      />

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[180px_1fr_220px] lg:items-center">
        {/* =================================================
            TIME
        ================================================= */}

        <div>
          <p className="text-2xl font-black tracking-tight text-[#111827]">
            {formatTime(
              schedule.scheduled_start
            )}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-400">
            {formatTimeRange(
              schedule.scheduled_start,
              schedule.scheduled_end
            )}
          </p>

          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
              postponed
                ? "bg-amber-50 text-amber-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {postponed
              ? "Postponed"
              : "Confirmed"}
          </span>
        </div>

        {/* =================================================
            MATCH
        ================================================= */}

        <div className="lg:border-x lg:border-slate-100 lg:px-7">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#E30613]">
              {match?.match_code ??
                "Match"}
            </span>

            {match?.round?.name && (
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                {
                  match.round.name
                }
              </span>
            )}
          </div>

          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {match?.competitions
              ?.sports?.name ??
              "Sport"}
          </p>

          <h3 className="mt-1 font-black text-[#111827]">
            {match?.competitions
              ?.name ??
              "Competition"}
          </h3>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
            <TeamName
              name={homeName}
              code={homeCode}
            />

            <div className="rounded-xl bg-[#111827] px-3 py-2 text-[10px] font-black text-white">
              VS
            </div>

            <TeamName
              name={awayName}
              code={awayCode}
              align="right"
            />
          </div>
        </div>

        {/* =================================================
            VENUE
        ================================================= */}

        <div className="rounded-2xl bg-[#F5F6F8] p-4 lg:bg-transparent lg:p-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Venue
          </p>

          <p className="mt-2 text-sm font-black text-[#111827]">
            {schedule.venues
              ?.name ??
              "Venue TBA"}
          </p>

          {schedule.venues
            ?.code && (
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {
                schedule.venues
                  .code
              }
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   TEAM NAME
========================================================= */

function TeamName({
  name,
  code,
  align = "left",
}: {
  name: string;
  code?: string;
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
      <p className="text-sm font-black text-[#111827] sm:text-base">
        {name}
      </p>

      {code && (
        <p className="mt-1 text-xs font-semibold text-slate-400">
          {code}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   GROUP SCHEDULES BY MALAYSIA DATE
========================================================= */

function groupSchedulesByDate(
  schedules: any[]
) {
  return schedules.reduce(
    (
      groups: Record<
        string,
        any[]
      >,
      schedule
    ) => {
      const key =
        getMalaysiaDateKey(
          schedule.scheduled_start
        );

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(
        schedule
      );

      return groups;
    },
    {}
  );
}

/* =========================================================
   MALAYSIA DATE KEY
========================================================= */

function getMalaysiaDateKey(
  value: string
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Kuala_Lumpur",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date(value)
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value ?? "";

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value ?? "";

  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value ?? "";

  return `${year}-${month}-${day}`;
}

/* =========================================================
   FULL DATE
========================================================= */

function formatFullDate(
  dateKey: string
) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone:
        "Asia/Kuala_Lumpur",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(
    new Date(
      `${dateKey}T00:00:00+08:00`
    )
  );
}

/* =========================================================
   DAY
========================================================= */

function formatDay(
  dateKey: string
) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone:
        "Asia/Kuala_Lumpur",
      day: "2-digit",
    }
  ).format(
    new Date(
      `${dateKey}T00:00:00+08:00`
    )
  );
}

/* =========================================================
   MONTH
========================================================= */

function formatMonth(
  dateKey: string
) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone:
        "Asia/Kuala_Lumpur",
      month: "short",
    }
  ).format(
    new Date(
      `${dateKey}T00:00:00+08:00`
    )
  );
}

/* =========================================================
   TIME
========================================================= */

function formatTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone:
        "Asia/Kuala_Lumpur",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  ).format(
    new Date(value)
  );
}

/* =========================================================
   TIME RANGE
========================================================= */

function formatTimeRange(
  start: string,
  end: string
) {
  if (!end) {
    return formatTime(start);
  }

  return `${formatTime(
    start
  )} – ${formatTime(end)}`;
}