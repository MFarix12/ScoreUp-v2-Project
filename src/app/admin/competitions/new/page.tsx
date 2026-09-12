import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createCompetition } from "../actions";

export default async function NewCompetitionPage() {
  const supabase = await createClient();

  const [
    sportsResult,
    formatsResult,
  ] = await Promise.all([
    supabase
      .from("sports")
      .select(`
        id,
        name,
        code,
        status,
        games_editions (
          id,
          name,
          year,
          is_active
        )
      `)
      .eq("status", "active")
      .order("name"),

    supabase
      .from("tournament_formats")
      .select(`
        id,
        name,
        code,
        supports_groups,
        supports_bracket
      `)
      .eq("is_active", true)
      .order("name"),
  ]);

  if (sportsResult.error) {
    throw new Error(
      sportsResult.error.message
    );
  }

  if (formatsResult.error) {
    throw new Error(
      formatsResult.error.message
    );
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] placeholder:text-slate-400 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100";

  const selectClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link
          href="/admin/competitions"
          className="text-sm font-semibold text-[#E30613] hover:underline"
        >
          ← Back to Competitions
        </Link>

        <div className="mb-3 mt-5 h-1 w-12 rounded-full bg-[#E30613]" />

        <h1 className="text-3xl font-bold text-[#111827]">
          Create Competition
        </h1>

        <p className="mt-2 text-slate-500">
          Create a competition and select its tournament
          format.
        </p>
      </div>

      <form
        action={createCompetition}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        {/* Sport */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Sport
          </label>

          <select
            name="sport_id"
            required
            defaultValue=""
            className={selectClass}
          >
            <option value="">
              Select sport
            </option>

            {sportsResult.data?.map((sport) => (
              <option
                key={sport.id}
                value={sport.id}
              >
                {sport.name}
                {" — "}
                {sport.games_editions?.name}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-slate-400">
            The Games Edition is inherited from the selected
            sport.
          </p>
        </div>

        {/* Tournament Format */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Tournament Format
          </label>

          <select
            name="tournament_format_id"
            required
            defaultValue=""
            className={selectClass}
          >
            <option value="">
              Select tournament format
            </option>

            {formatsResult.data?.map((format) => (
              <option
                key={format.id}
                value={format.id}
              >
                {format.name}
              </option>
            ))}
          </select>
        </div>

        {/* Name + Code */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#111827]">
              Competition Name
            </label>

            <input
              name="name"
              required
              placeholder="Football Men"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#111827]">
              Competition Code
            </label>

            <input
              name="code"
              required
              placeholder="FOOTBALL-MEN"
              className={`${inputClass} uppercase`}
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Category
          </label>

          <input
            name="category"
            placeholder="Example: Men, Women, Open"
            className={inputClass}
          />

          <p className="mt-2 text-xs text-slate-400">
            Optional classification for the competition.
          </p>
        </div>

        {/* Competition Type */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Competition Type
          </label>

          <select
            name="competition_type"
            required
            defaultValue="team"
            className={selectClass}
          >
            <option value="team">
              Team
            </option>

            <option value="individual">
              Individual
            </option>

            <option value="pair">
              Pair
            </option>
          </select>
        </div>

        {/* Medal event */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="is_medal_event"
              defaultChecked
              className="mt-1 h-4 w-4 accent-[#E30613]"
            />

            <div>
              <p className="text-sm font-semibold text-[#111827]">
                Medal Event
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Placements from this competition may
                contribute to medal standings.
              </p>
            </div>
          </label>
        </div>

        {/* Status */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Competition Status
          </label>

          <select
            name="status"
            defaultValue="draft"
            className={selectClass}
          >
            <option value="draft">
              Draft
            </option>

            <option value="setup">
              Setup
            </option>

            <option value="scheduled">
              Scheduled
            </option>

            <option value="in_progress">
              In Progress
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="archived">
              Archived
            </option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
          <Link
            href="/admin/competitions"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#111827] transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-xl bg-[#E30613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B0000C]"
          >
            Create Competition
          </button>
        </div>
      </form>
    </div>
  );
}