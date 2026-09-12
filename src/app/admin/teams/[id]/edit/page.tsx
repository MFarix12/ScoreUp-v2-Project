import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { updateTeam } from "../../../actions";

interface EditTeamPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTeamPage({
  params,
}: EditTeamPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const [teamResult, editionsResult] = await Promise.all([
    supabase
      .from("teams")
      .select("*")
      .eq("id", id)
      .single(),

    supabase
      .from("games_editions")
      .select(`
        id,
        name,
        year
      `)
      .order("year", {
        ascending: false,
      }),
  ]);

  if (teamResult.error || !teamResult.data) {
    notFound();
  }

  if (editionsResult.error) {
    throw new Error(editionsResult.error.message);
  }

  const team = teamResult.data;

  const updateAction =
    updateTeam.bind(null, team.id);

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] placeholder:text-slate-400 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100";

  const selectClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link
          href="/admin/teams"
          className="text-sm font-semibold text-[#E30613] hover:underline"
        >
          ← Back to Teams
        </Link>

        <div className="mb-3 mt-5 h-1 w-12 rounded-full bg-[#E30613]" />

        <h1 className="text-3xl font-bold text-[#111827]">
          Edit Team
        </h1>

        <p className="mt-2 text-slate-500">
          Update {team.name}.
        </p>
      </div>

      <form
        action={updateAction}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Games Edition
          </label>

          <select
            name="games_edition_id"
            required
            defaultValue={team.games_edition_id}
            className={selectClass}
          >
            {editionsResult.data?.map((edition) => (
              <option
                key={edition.id}
                value={edition.id}
              >
                {edition.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#111827]">
              Team Name
            </label>

            <input
              name="name"
              required
              defaultValue={team.name}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#111827]">
              Short Name
            </label>

            <input
              name="short_name"
              defaultValue={team.short_name ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Team Code
          </label>

          <input
            name="code"
            required
            defaultValue={team.code}
            className={`${inputClass} uppercase`}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Description
          </label>

          <textarea
            name="description"
            rows={4}
            defaultValue={team.description ?? ""}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Status
          </label>

          <select
            name="status"
            defaultValue={team.status}
            className={selectClass}
          >
            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

            <option value="withdrawn">
              Withdrawn
            </option>
          </select>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
          <Link
            href="/admin/teams"
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