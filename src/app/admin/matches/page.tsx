import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function AdminMatchesPage() {
  const supabase = await createClient();

  const {
    data: matches,
    error,
  } = await supabase
    .from("matches")
    .select(`
      id,
      match_code,
      match_number,
      status,
      competition_id,

      competitions (
        id,
        name,

        sports (
          name,

          games_editions (
            name
          )
        )
      ),

      tournament_rounds (
        name
      ),

      home:competition_participants!matches_home_participant_fk (
        id,

        teams (
          name
        )
      ),

      away:competition_participants!matches_away_participant_fk (
        id,

        teams (
          name
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
          name
        )
      )
    `)
    .order("match_number", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-3 h-1 w-12 rounded-full bg-[#E30613]" />

        <h1 className="text-3xl font-bold text-[#111827]">
          Matches
        </h1>

        <p className="mt-2 text-slate-500">
          Manage generated matches and schedules.
        </p>
      </div>

      <div className="space-y-4">
        {matches?.map((match) => {
          const currentSchedule =
            match.match_schedules?.find(
              (schedule) =>
                schedule.is_current
            );

          return (
            <div
              key={match.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-4 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#E30613]">
                      {match.match_code}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                      {match.status.replaceAll(
                        "_",
                        " "
                      )}
                    </span>
                  </div>

                  <h2 className="mt-2 font-bold text-[#111827]">
                    {match.competitions
                      ?.name ??
                      "Competition"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    {match.tournament_rounds
                      ?.name ?? "Match"}
                  </p>
                </div>

                <Link
                  href={`/admin/matches/${match.id}`}
                  className="rounded-xl bg-[#E30613] px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#B0000C]"
                >
                  Manage Schedule
                </Link>
              </div>

              <div className="grid gap-0 md:grid-cols-2">
                <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Fixture
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <p className="font-bold text-[#111827]">
                      {match.home
                        ?.teams?.name ??
                        "TBD"}
                    </p>

                    <span className="text-xs font-bold text-slate-300">
                      VS
                    </span>

                    <p className="font-bold text-[#111827]">
                      {match.away
                        ?.teams?.name ??
                        "TBD"}
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Schedule
                  </p>

                  {currentSchedule ? (
                    <div className="mt-3">
                      <p className="font-semibold text-[#111827]">
                        {formatDateTime(
                          currentSchedule.scheduled_start
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {currentSchedule
                          .venues?.name ??
                          "Venue"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                          {currentSchedule.schedule_status}
                        </span>

                        {currentSchedule.is_published && (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-[#E30613]">
                            Published
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm font-medium text-amber-600">
                      Not scheduled
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {matches?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-semibold text-[#111827]">
              No matches found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Generate a tournament first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone:
        "Asia/Kuala_Lumpur",
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(new Date(value));
}