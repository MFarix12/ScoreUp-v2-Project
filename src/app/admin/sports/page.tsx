import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function SportsPage() {
  const supabase = await createClient();

  const { data: sports, error } = await supabase
    .from("sports")
    .select(`
      id,
      name,
      code,
      description,
      sport_type,
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
            Sports
          </h1>

          <p className="mt-2 text-slate-500">
            Manage sports for each SuperUPSI Games edition.
          </p>
        </div>

        <Link
          href="/admin/sports/new"
          className="rounded-xl bg-[#E30613] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#B0000C]"
        >
          + New Sport
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-[#E30613]" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">
                  Sport
                </th>

                <th className="px-6 py-4 font-semibold text-slate-700">
                  Edition
                </th>

                <th className="px-6 py-4 font-semibold text-slate-700">
                  Type
                </th>

                <th className="px-6 py-4 font-semibold text-slate-700">
                  Status
                </th>

                <th className="px-6 py-4 font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {sports?.map((sport) => (
                <tr
                  key={sport.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#111827]">
                      {sport.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {sport.code}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {sport.games_editions?.name ?? "-"}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {sport.sport_type}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {sport.status === "active" ? (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/sports/${sport.id}/edit`}
                      className="font-semibold text-[#E30613] hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}

              {sports?.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No sports found.
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