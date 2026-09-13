import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function ParticipantsPage() {
  const supabase = await createClient();

  const {
    data: participants,
    error,
  } = await supabase
    .from("competition_participants")
    .select(`
      id,
      participant_type,
      seed_number,
      status,

      teams (
        id,
        name,
        short_name,
        code
      ),

      competitions (
        id,
        name,
        code,
        competition_type,

        sports (
          id,
          name,

          games_editions (
            id,
            name,
            year
          )
        )
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-3 h-1 w-12 rounded-full bg-[#E30613]" />

          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Participants
          </h1>

          <p className="mt-2 text-slate-500">
            Manage teams registered for competitions.
          </p>
        </div>

        <Link
          href="/admin/participants/new"
          className="rounded-xl bg-[#E30613] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#B0000C]"
        >
          + Register Participant
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-[#E30613]" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Participant
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Competition
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Sport
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Edition
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Seed
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {participants?.map(
                (participant) => (
                  <tr
                    key={participant.id}
                    className="transition hover:bg-red-50/30"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#111827]">
                        {participant.teams
                          ?.name ?? "Participant"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {participant.teams
                          ?.code ?? "-"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">
                        {participant
                          .competitions
                          ?.name ?? "-"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {participant
                          .competitions
                          ?.code ?? ""}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {participant
                        .competitions
                        ?.sports?.name ??
                        "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {participant
                        .competitions
                        ?.sports
                        ?.games_editions
                        ?.name ?? "-"}
                    </td>

                    <td className="px-6 py-4">
                      {participant.seed_number ? (
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-red-50 px-2 font-bold text-[#E30613]">
                          {
                            participant.seed_number
                          }
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {participant.status ===
                      "active" ? (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : participant.status ===
                        "disqualified" ? (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          Disqualified
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Withdrawn
                        </span>
                      )}
                    </td>
                  </tr>
                )
              )}

              {participants?.length ===
                0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No competition participants
                    found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}