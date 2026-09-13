import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { MatchScheduleForm } from "@/components/admin/match-schedule-form";

interface MatchSchedulePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MatchSchedulePage({
  params,
}: MatchSchedulePageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: match,
    error: matchError,
  } = await supabase
    .from("matches")
    .select(`
      id,
      match_code,
      match_number,
      status,

      competitions (
        id,
        name,

        sports (
          id,
          name,
          games_edition_id,

          games_editions (
            id,
            name,
            year
          )
        )
      ),

      tournament_rounds (
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
        venue_id,
        scheduled_start,
        scheduled_end,
        schedule_status,
        is_current,
        reason,
        is_published,
        published_at,

        venues (
          id,
          name,
          code
        )
      )
    `)
    .eq("id", id)
    .single();

  if (matchError || !match) {
    notFound();
  }

  const editionId =
    match.competitions?.sports?.games_edition_id;

  if (!editionId) {
    throw new Error(
      "Unable to determine the Games Edition for this match."
    );
  }

  const {
    data: venues,
    error: venuesError,
  } = await supabase
    .from("venues")
    .select(`
      id,
      name,
      code,
      venue_type,
      status
    `)
    .eq("games_edition_id", editionId)
    .eq("status", "active")
    .order("name", {
      ascending: true,
    });

  if (venuesError) {
    throw new Error(venuesError.message);
  }

  const currentSchedule =
    match.match_schedules?.find(
      (schedule) => schedule.is_current
    ) ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* ========================================
          PAGE HEADER
      ======================================== */}
      <div>
        <Link
          href="/admin/matches"
          className="text-sm font-semibold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
        >
          ← Back to Matches
        </Link>

        <div className="mb-3 mt-5 h-1 w-12 rounded-full bg-[#E30613]" />

        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
          Match Scheduling
        </h1>

        <p className="mt-2 text-slate-500">
          {match.competitions?.name ?? "Competition"}
          {" · "}
          {match.tournament_rounds?.name ?? "Match"}
          {" · "}
          {match.match_code}
        </p>
      </div>

      {/* ========================================
          MATCH INFORMATION
      ======================================== */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-[#E30613]" />

        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#E30613]">
                {match.match_code}
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#111827]">
                {match.competitions?.name ?? "Competition"}
              </h2>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                match.status === "completed"
                  ? "bg-green-50 text-green-700"
                  : match.status === "ready"
                    ? "bg-red-50 text-[#E30613]"
                    : match.status === "postponed"
                      ? "bg-amber-50 text-amber-700"
                      : match.status === "cancelled"
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-600"
              }`}
            >
              {match.status.replaceAll("_", " ")}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_auto_1fr]">
          <TeamCard
            label="Home"
            name={
              match.home?.teams?.name ??
              "TBD"
            }
            code={
              match.home?.teams?.code ??
              null
            }
          />

          <div className="hidden items-center justify-center px-6 text-sm font-black text-slate-300 md:flex">
            VS
          </div>

          <TeamCard
            label="Away"
            name={
              match.away?.teams?.name ??
              "TBD"
            }
            code={
              match.away?.teams?.code ??
              null
            }
            right
          />
        </div>
      </section>

      {/* ========================================
          CURRENT SCHEDULE
      ======================================== */}
      {currentSchedule && (
        <section className="overflow-hidden rounded-2xl border border-green-200 bg-green-50">
          <div className="p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-bold text-green-900">
                  Current Schedule
                </p>

                <p className="mt-2 text-lg font-semibold text-[#111827]">
                  {formatDateTime(
                    currentSchedule.scheduled_start
                  )}
                </p>

                <p className="mt-1 text-sm text-green-800">
                  until{" "}
                  {formatTime(
                    currentSchedule.scheduled_end
                  )}
                </p>

                <p className="mt-3 text-sm font-medium text-green-800">
                  {currentSchedule.venues?.name ??
                    "Venue"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-green-700">
                  {currentSchedule.schedule_status.replaceAll(
                    "_",
                    " "
                  )}
                </span>

                {currentSchedule.is_published && (
                  <span className="rounded-full bg-[#E30613] px-3 py-1 text-xs font-semibold text-white">
                    Published
                  </span>
                )}
              </div>
            </div>

            {currentSchedule.reason && (
              <div className="mt-5 rounded-xl border border-green-200 bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  Notes
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm text-green-900">
                  {currentSchedule.reason}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================
          SCHEDULE FORM
      ======================================== */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#111827]">
            {currentSchedule
              ? "Update Schedule"
              : "Create Schedule"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select a venue and schedule the match.
            ScoreUp will automatically check for
            venue and participant conflicts.
          </p>
        </div>

        <MatchScheduleForm
          matchId={match.id}
          venues={venues ?? []}
          currentSchedule={
            currentSchedule
              ? {
                  venue_id:
                    currentSchedule.venue_id,

                  scheduled_start:
                    currentSchedule.scheduled_start,

                  scheduled_end:
                    currentSchedule.scheduled_end,

                  schedule_status:
                    currentSchedule.schedule_status,

                  reason:
                    currentSchedule.reason,

                  is_published:
                    currentSchedule.is_published,
                }
              : null
          }
        />
      </section>
    </div>
  );
}

function TeamCard({
  label,
  name,
  code,
  right = false,
}: {
  label: string;
  name: string;
  code: string | null;
  right?: boolean;
}) {
  const isTbd = name === "TBD";

  return (
    <div
      className={`p-8 ${
        right
          ? "border-t border-slate-100 md:border-l md:border-t-0"
          : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <h3
        className={`mt-3 text-xl font-bold ${
          isTbd
            ? "text-slate-400"
            : "text-[#111827]"
        }`}
      >
        {name}
      </h3>

      {code && (
        <p className="mt-1 text-xs font-medium text-slate-400">
          {code}
        </p>
      )}

      {isTbd && (
        <p className="mt-2 text-xs text-slate-400">
          Participant will be determined by
          tournament progression.
        </p>
      )}
    </div>
  );
}

function formatDateTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone: "Asia/Kuala_Lumpur",
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(new Date(value));
}

function formatTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone: "Asia/Kuala_Lumpur",
      timeStyle: "short",
    }
  ).format(new Date(value));
}