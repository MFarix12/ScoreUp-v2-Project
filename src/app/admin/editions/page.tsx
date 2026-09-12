import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function EditionsPage() {
  const supabase = await createClient();

  const { data: editions, error } = await supabase
    .from("games_editions")
    .select(`
      id,
      name,
      year,
      start_date,
      end_date,
      status,
      is_active,
      is_public
    `)
    .order("year", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-3 h-1 w-12 rounded-full bg-[#E30613]" />

          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Games Editions
          </h1>

          <p className="mt-2 text-slate-500">
            Manage SuperUPSI Games editions.
          </p>
        </div>

        <Link
          href="/admin/editions/new"
          className="rounded-xl bg-[#E30613] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#B0000C]"
        >
          + New Edition
        </Link>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-[#E30613]" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Edition
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Period
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Status
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Active
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Public
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {editions?.map((edition) => (
                <tr
                  key={edition.id}
                  className="transition hover:bg-red-50/30"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-[#111827]">
                        {edition.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {edition.year}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {edition.start_date}
                    {" → "}
                    {edition.end_date}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {edition.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {edition.is_active ? (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Yes
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                        No
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {edition.is_public ? (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Public
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                        Private
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/editions/${edition.id}/edit`}
                      className="font-semibold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}

              {editions?.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No Games Editions found.
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