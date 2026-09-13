import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function VenuesPage() {
  const supabase = await createClient();

  const { data: venues, error } =
    await supabase
      .from("venues")
      .select(`
        id,
        name,
        code,
        venue_type,
        location_description,
        capacity,
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
      {/* ========================================
          PAGE HEADER
      ======================================== */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-3 h-1 w-12 rounded-full bg-[#E30613]" />

          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Venues
          </h1>

          <p className="mt-2 text-slate-500">
            Manage competition venues for SuperUPSI Games.
          </p>
        </div>

        <Link
          href="/admin/venues/new"
          className="rounded-xl bg-[#E30613] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#B0000C]"
        >
          + New Venue
        </Link>
      </div>

      {/* ========================================
          VENUE TABLE
      ======================================== */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-[#E30613]" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Venue
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Type
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Edition
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Capacity
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
              {venues?.map((venue) => (
                <tr
                  key={venue.id}
                  className="transition hover:bg-red-50/30"
                >
                  {/* Venue */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-[#111827]">
                        {venue.name}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {venue.code}
                      </p>

                      {venue.location_description && (
                        <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                          {venue.location_description}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {venue.venue_type}
                    </span>
                  </td>

                  {/* Edition */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-700">
                      {venue.games_editions?.name ?? "-"}
                    </p>

                    {venue.games_editions?.year && (
                      <p className="mt-1 text-xs text-slate-400">
                        {venue.games_editions.year}
                      </p>
                    )}
                  </td>

                  {/* Capacity */}
                  <td className="px-6 py-4 text-slate-600">
                    {venue.capacity !== null &&
                    venue.capacity !== undefined
                      ? venue.capacity.toLocaleString()
                      : "—"}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {venue.status === "active" ? (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <Link
                        href={`/admin/venues/${venue.id}/edit`}
                        className="font-semibold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
                      >
                        Edit
                      </Link>

                      <Link
                        href={`/admin/venues/${venue.id}/availability`}
                        className="font-semibold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
                      >
                        Availability
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {venues?.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-14 text-center"
                  >
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 font-bold text-[#E30613]">
                        V
                      </div>

                      <p className="mt-4 font-semibold text-[#111827]">
                        No venues created yet
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Create a venue before scheduling competition matches.
                      </p>

                      <Link
                        href="/admin/venues/new"
                        className="mt-5 inline-block rounded-xl bg-[#E30613] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B0000C]"
                      >
                        Create Venue
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================
          HELP INFORMATION
      ======================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-[#111827]">
          Venue Scheduling
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Use <strong>Availability</strong> to define when a venue is
          available, unavailable, reserved, or under maintenance. ScoreUp
          will use this information when validating match schedules.
        </p>
      </div>
    </div>
  );
}