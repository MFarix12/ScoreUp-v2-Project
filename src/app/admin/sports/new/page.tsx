import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createSport } from "../actions";

export default async function NewSportPage() {
  const supabase = await createClient();

  const { data: editions, error } = await supabase
    .from("games_editions")
    .select(`
      id,
      name,
      year,
      is_active
    `)
    .order("year", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const activeEdition =
    editions?.find((edition) => edition.is_active) ??
    editions?.[0];

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] placeholder:text-slate-400 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100";

  const selectClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100";

  return (
    <div className="mx-auto max-w-3xl">
      {/* Page Header */}
      <div className="mb-8">
        <Link
          href="/admin/sports"
          className="text-sm font-semibold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
        >
          ← Back to Sports
        </Link>

        <div className="mb-3 mt-5 h-1 w-12 rounded-full bg-[#E30613]" />

        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
          Create Sport
        </h1>

        <p className="mt-2 text-slate-500">
          Add a sport to a SuperUPSI Games edition.
        </p>
      </div>

      {/* Form */}
      <form
        action={createSport}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        {/* Games Edition */}
        <div>
          <label
            htmlFor="games_edition_id"
            className="mb-2 block text-sm font-semibold text-[#111827]"
          >
            Games Edition
          </label>

          <select
            id="games_edition_id"
            name="games_edition_id"
            required
            defaultValue={activeEdition?.id ?? ""}
            className={selectClass}
          >
            <option value="">
              Select edition
            </option>

            {editions?.map((edition) => (
              <option
                key={edition.id}
                value={edition.id}
                className="bg-white text-[#111827]"
              >
                {edition.name}
                {edition.is_active ? " — Active" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Sport Name + Code */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-[#111827]"
            >
              Sport Name
            </label>

            <input
              id="name"
              name="name"
              required
              placeholder="Football"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="code"
              className="mb-2 block text-sm font-semibold text-[#111827]"
            >
              Sport Code
            </label>

            <input
              id="code"
              name="code"
              required
              placeholder="FOOTBALL"
              className={`${inputClass} uppercase`}
            />
          </div>
        </div>

        {/* Sport Type */}
        <div>
          <label
            htmlFor="sport_type"
            className="mb-2 block text-sm font-semibold text-[#111827]"
          >
            Sport Type
          </label>

          <select
            id="sport_type"
            name="sport_type"
            required
            defaultValue="team"
            className={selectClass}
          >
            <option
              value="team"
              className="bg-white text-[#111827]"
            >
              Team
            </option>

            <option
              value="individual"
              className="bg-white text-[#111827]"
            >
              Individual
            </option>

            <option
              value="mixed"
              className="bg-white text-[#111827]"
            >
              Mixed
            </option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-[#111827]"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Optional sport description..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="status"
            className="mb-2 block text-sm font-semibold text-[#111827]"
          >
            Status
          </label>

          <select
            id="status"
            name="status"
            defaultValue="active"
            className={selectClass}
          >
            <option
              value="active"
              className="bg-white text-[#111827]"
            >
              Active
            </option>

            <option
              value="inactive"
              className="bg-white text-[#111827]"
            >
              Inactive
            </option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
          <Link
            href="/admin/sports"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#111827] transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-xl bg-[#E30613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B0000C]"
          >
            Create Sport
          </button>
        </div>
      </form>
    </div>
  );
}