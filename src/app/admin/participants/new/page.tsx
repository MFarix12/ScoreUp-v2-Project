import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { registerTeamParticipant } from "../actions";

export default async function NewParticipantPage() {
  const supabase = await createClient();

  const [
    competitionsResult,
    teamsResult,
  ] = await Promise.all([
    supabase
      .from("competitions")
      .select(`
        id,
        name,
        code,
        competition_type,
        status,

        sports (
          id,
          name,
          games_edition_id,

          games_editions (
            id,
            name,
            year
          )
        )
      `)
      .eq("competition_type", "team")
      .in("status", [
        "draft",
        "setup",
      ])
      .order("name"),

    supabase
      .from("teams")
      .select(`
        id,
        name,
        short_name,
        code,
        games_edition_id,
        status,

        games_editions (
          id,
          name,
          year
        )
      `)
      .eq("status", "active")
      .order("name"),
  ]);

  if (competitionsResult.error) {
    throw new Error(
      competitionsResult.error.message
    );
  }

  if (teamsResult.error) {
    throw new Error(
      teamsResult.error.message
    );
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] placeholder:text-slate-400 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100";

  const selectClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100";

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/participants"
          className="text-sm font-semibold text-[#E30613] hover:underline"
        >
          ← Back to Participants
        </Link>

        <div className="mb-3 mt-5 h-1 w-12 rounded-full bg-[#E30613]" />

        <h1 className="text-3xl font-bold text-[#111827]">
          Register Participant
        </h1>

        <p className="mt-2 text-slate-500">
          Register a team for a competition.
        </p>
      </div>

      <form
        action={registerTeamParticipant}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        {/* Competition */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Competition
          </label>

          <select
            name="competition_id"
            required
            defaultValue=""
            className={selectClass}
          >
            <option value="">
              Select competition
            </option>

            {competitionsResult.data?.map(
              (competition) => (
                <option
                  key={competition.id}
                  value={competition.id}
                >
                  {competition.name}
                  {" — "}
                  {competition.sports
                    ?.games_editions?.name}
                </option>
              )
            )}
          </select>

          <p className="mt-2 text-xs text-slate-400">
            Only team competitions in Draft or Setup
            status are shown.
          </p>
        </div>

        {/* Team */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Team
          </label>

          <select
            name="team_id"
            required
            defaultValue=""
            className={selectClass}
          >
            <option value="">
              Select team
            </option>

            {teamsResult.data?.map(
              (team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.name}
                  {" — "}
                  {team.games_editions
                    ?.name}
                </option>
              )
            )}
          </select>

          <p className="mt-2 text-xs text-slate-400">
            ScoreUp will verify that the team and
            competition belong to the same Games
            Edition.
          </p>
        </div>

        {/* Seed */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Seed Number
          </label>

          <input
            name="seed_number"
            type="number"
            min="1"
            step="1"
            placeholder="Optional"
            className={inputClass}
          />

          <p className="mt-2 text-xs text-slate-400">
            Leave blank if seeding will be generated
            later.
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Notes
          </label>

          <textarea
            name="notes"
            rows={4}
            placeholder="Optional registration notes..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Information */}
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
          <p className="text-sm font-semibold text-[#111827]">
            Registration Process
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-600">
            Because this registration is being
            performed by an Administrator, ScoreUp
            will approve the registration immediately
            and create the competition participant.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
          <Link
            href="/admin/participants"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#111827] transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-xl bg-[#E30613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B0000C]"
          >
            Register Team
          </button>
        </div>
      </form>
    </div>
  );
}