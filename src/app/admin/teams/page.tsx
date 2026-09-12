import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function TeamsPage() {
  const supabase = await createClient();

  const { data: teams, error } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      short_name,
      code,
      description,
      status,
      games_editions (
        id,
        name,
        year
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-3 h-1 w-12 rounded-full bg-[#E30613]" />

          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Teams
          </h1>

          <p className="mt-2 text-slate-500">
            Manage participating SuperUPSI Games teams.
          </p>
        </div>

        <Link
          href="/admin/teams/new"
          className="rounded-xl bg-[#E30613] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#B0000C]"
        >
          + New Team
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-[#E30613]" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Team
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Code
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Edition
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
              {teams?.map((team) => (
                <tr
                  key={team.id}
                  className="transition hover:bg-red-50/30"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#111827]">
                      {team.name}
                    </p>

                    {team.short_name && (
                      <p className="mt-1 text-xs text-slate-500">
                        {team.short_name}
                      </p>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {team.code}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {team.games_editions?.name ?? "-"}
                  </td>

                  <td className="px-6 py-4">
                    {team.status === "active" ? (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    ) : team.status === "withdrawn" ? (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        Withdrawn
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/teams/${team.id}/edit`}
                      className="font-semibold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}

              {teams?.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No teams found.
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