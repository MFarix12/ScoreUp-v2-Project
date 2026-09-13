import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { addVenueAvailability } from "./actions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VenueAvailabilityPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const [
    venueResult,
    availabilityResult,
  ] = await Promise.all([
    supabase
      .from("venues")
      .select(`
        id,
        name,
        code
      `)
      .eq("id", id)
      .single(),

    supabase
      .from("venue_availability")
      .select("*")
      .eq("venue_id", id)
      .order("available_date")
      .order("start_time"),
  ]);

  if (
    venueResult.error ||
    !venueResult.data
  ) {
    notFound();
  }

  if (availabilityResult.error) {
    throw new Error(
      availabilityResult.error.message
    );
  }

  const venue =
    venueResult.data;

  const addAction =
    addVenueAvailability.bind(
      null,
      venue.id
    );

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] outline-none focus:border-[#E30613] focus:ring-2 focus:ring-red-100";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/venues"
          className="text-sm font-semibold text-[#E30613] hover:underline"
        >
          ← Back to Venues
        </Link>

        <div className="mb-3 mt-5 h-1 w-12 rounded-full bg-[#E30613]" />

        <h1 className="text-3xl font-bold text-[#111827]">
          Venue Availability
        </h1>

        <p className="mt-2 text-slate-500">
          {venue.name}
        </p>
      </div>

      <form
        action={addAction}
        className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-4"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold">
            Date
          </label>

          <input
            type="date"
            name="available_date"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Start Time
          </label>

          <input
            type="time"
            name="start_time"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            End Time
          </label>

          <input
            type="time"
            name="end_time"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Status
          </label>

          <select
            name="availability_status"
            defaultValue="available"
            className={inputClass}
          >
            <option value="available">
              Available
            </option>

            <option value="unavailable">
              Unavailable
            </option>

            <option value="reserved">
              Reserved
            </option>

            <option value="maintenance">
              Maintenance
            </option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="mb-2 block text-sm font-semibold">
            Reason
          </label>

          <input
            name="reason"
            placeholder="Optional"
            className={inputClass}
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-[#E30613] px-5 py-3 text-sm font-semibold text-white hover:bg-[#B0000C]"
          >
            Add Availability
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-[#E30613]" />

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4">
                Date
              </th>

              <th className="px-6 py-4">
                Time
              </th>

              <th className="px-6 py-4">
                Status
              </th>

              <th className="px-6 py-4">
                Reason
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {availabilityResult.data?.map(
              (item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    {item.available_date}
                  </td>

                  <td className="px-6 py-4">
                    {item.start_time}
                    {" – "}
                    {item.end_time}
                  </td>

                  <td className="px-6 py-4 capitalize">
                    {
                      item.availability_status
                    }
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {item.reason ?? "—"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}