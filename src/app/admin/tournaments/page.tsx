import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function TournamentsPage() {
  const supabase = await createClient();

  const {
    data: competitions,
    error,
  } = await supabase
    .from("competitions")
    .select(`
      id,
      name,
      code,
      status,

      sports (
        name,
        games_editions (
          name,
          year
        )
      ),

      tournament_formats (
        name,
        code
      ),

      competition_participants (
        id,
        status
      ),

      competition_stages (
        id
      )
    `)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-3 h-1 w-12 rounded-full bg-[#E30613]" />

        <h1 className="text-3xl font-bold text-[#111827]">
          Tournament Management
        </h1>

        <p className="mt-2 text-slate-500">
          Configure and generate tournament fixtures.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-[#E30613]" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4">
                  Competition
                </th>

                <th className="px-6 py-4">
                  Sport
                </th>

                <th className="px-6 py-4">
                  Format
                </th>

                <th className="px-6 py-4">
                  Participants
                </th>

                <th className="px-6 py-4">
                  Tournament
                </th>

                <th className="px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {competitions?.map(
                (competition) => {
                  const participantCount =
                    competition
                      .competition_participants
                      ?.filter(
                        (participant) =>
                          participant.status ===
                          "active"
                      ).length ?? 0;

                  const generated =
                    (
                      competition
                        .competition_stages
                        ?.length ?? 0
                    ) > 0;

                  return (
                    <tr
                      key={competition.id}
                      className="hover:bg-red-50/30"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#111827]">
                          {competition.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {competition.code}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {competition.sports
                          ?.name ?? "-"}
                      </td>

                      <td className="px-6 py-4">
                        {
                          competition
                            .tournament_formats
                            ?.name
                        }
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-[#111827]">
                          {
                            participantCount
                          }
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {generated ? (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            Generated
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            Not Generated
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/tournaments/${competition.id}`}
                          className="font-semibold text-[#E30613] hover:underline"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                }
              )}

              {competitions?.length ===
                0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No competitions found.
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