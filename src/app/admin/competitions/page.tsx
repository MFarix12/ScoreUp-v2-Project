import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function CompetitionsPage() {
  const supabase = await createClient();

  const { data: competitions, error } =
    await supabase
      .from("competitions")
      .select(`
        id,
        name,
        code,
        category,
        competition_type,
        is_medal_event,
        status,
        sports (
          id,
          name,
          code,
          games_editions (
            id,
            name,
            year
          )
        ),
        tournament_formats (
          id,
          name,
          code
        )
      `)
      .order("name", {
        ascending: true,
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
            Competitions
          </h1>

          <p className="mt-2 text-slate-500">
            Manage competition events and tournament
            formats.
          </p>
        </div>

        <Link
          href="/admin/competitions/new"
          className="rounded-xl bg-[#E30613] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#B0000C]"
        >
          + New Competition
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
                  Competition
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Sport
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Format
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Type
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Medal
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Status
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {competitions?.map((competition) => (
                <tr
                  key={competition.id}
                  className="transition hover:bg-red-50/30"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#111827]">
                      {competition.name}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>
                        {competition.code}
                      </span>

                      {competition.category && (
                        <>
                          <span>•</span>
                          <span>
                            {competition.category}
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-700">
                      {competition.sports?.name ?? "-"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {competition.sports
                        ?.games_editions?.name ?? ""}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {competition.tournament_formats
                      ?.name ?? "-"}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {competition.competition_type}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {competition.is_medal_event ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        Medal
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">
                        No
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        competition.status === "completed"
                          ? "bg-green-50 text-green-700"
                          : competition.status ===
                              "in_progress"
                            ? "bg-red-50 text-[#E30613]"
                            : competition.status ===
                                "scheduled"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {competition.status.replace(
                        "_",
                        " "
                      )}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/competitions/${competition.id}/edit`}
                      className="font-semibold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}

              {competitions?.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
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