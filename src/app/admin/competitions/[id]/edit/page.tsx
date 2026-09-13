import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { updateCompetition } from "../../actions";

interface EditCompetitionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCompetitionPage({
  params,
}: EditCompetitionPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const [
    competitionResult,
    sportsResult,
    formatsResult,
  ] = await Promise.all([
    supabase
      .from("competitions")
      .select("*")
      .eq("id", id)
      .single(),

    supabase
      .from("sports")
      .select(`
        id,
        name,
        code,
        games_editions (
          id,
          name,
          year
        )
      `)
      .order("name"),

    supabase
      .from("tournament_formats")
      .select(`
        id,
        name,
        code
      `)
      .eq("is_active", true)
      .order("name"),
  ]);

  if (
    competitionResult.error ||
    !competitionResult.data
  ) {
    notFound();
  }

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

  const competition =
    competitionResult.data;

  const updateAction =
    updateCompetition.bind(
      null,
      competition.id
    );

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
          Edit Competition
        </h1>

        <p className="mt-2 text-slate-500">
          Update {competition.name}.
        </p>
      </div>

      <form
        action={updateAction}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Sport
          </label>

          <select
            name="sport_id"
            required
            defaultValue={competition.sport_id}
            className={selectClass}
          >
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
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Tournament Format
          </label>

          <select
            name="tournament_format_id"
            required
            defaultValue={
              competition.tournament_format_id
            }
            className={selectClass}
          >
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

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#111827]">
              Competition Name
            </label>

            <input
              name="name"
              required
              defaultValue={competition.name}
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
              defaultValue={competition.code}
              className={`${inputClass} uppercase`}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Category
          </label>

          <input
            name="category"
            defaultValue={
              competition.category ?? ""
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Competition Type
          </label>

          <select
            name="competition_type"
            defaultValue={
              competition.competition_type
            }
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

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="is_medal_event"
              defaultChecked={
                competition.is_medal_event
              }
              className="mt-1 h-4 w-4 accent-[#E30613]"
            />

            <div>
              <p className="text-sm font-semibold text-[#111827]">
                Medal Event
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Include this competition in medal
                placement processing.
              </p>
            </div>
          </label>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Status
          </label>

          <select
            name="status"
            defaultValue={competition.status}
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

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
          <Link
            href="/admin/competitions"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#111827] hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-xl bg-[#E30613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B0000C]"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}