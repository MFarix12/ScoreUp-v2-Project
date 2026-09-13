import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { updateSport } from "../../actions";

interface EditSportPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSportPage({
  params,
}: EditSportPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const [
    sportResult,
    editionsResult,
  ] = await Promise.all([
    supabase
      .from("sports")
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

  if (
    sportResult.error ||
    !sportResult.data
  ) {
    notFound();
  }

  if (editionsResult.error) {
    throw new Error(
      editionsResult.error.message
    );
  }

  const sport = sportResult.data;

  const updateAction =
    updateSport.bind(null, sport.id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link
          href="/admin/sports"
          className="text-sm font-semibold text-[#E30613] hover:underline"
        >
          ← Back to Sports
        </Link>

        <div className="mt-5 mb-3 h-1 w-12 rounded-full bg-[#E30613]" />

        <h1 className="text-3xl font-bold text-[#111827]">
          Edit Sport
        </h1>

        <p className="mt-2 text-slate-500">
          Update {sport.name}.
        </p>
      </div>

      <form
        action={updateAction}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Games Edition
          </label>

          <select
            name="games_edition_id"
            required
            defaultValue={
              sport.games_edition_id
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
          >
            {editionsResult.data?.map(
              (edition) => (
                <option
                  key={edition.id}
                  value={edition.id}
                >
                  {edition.name}
                </option>
              )
            )}
          </select>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Sport Name
            </label>

            <input
              name="name"
              required
              defaultValue={sport.name}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Sport Code
            </label>

            <input
              name="code"
              required
              defaultValue={sport.code}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Sport Type
          </label>

          <select
            name="sport_type"
            defaultValue={sport.sport_type}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
          >
            <option value="team">
              Team
            </option>

            <option value="individual">
              Individual
            </option>

            <option value="mixed">
              Mixed
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Description
          </label>

          <textarea
            name="description"
            rows={4}
            defaultValue={
              sport.description ?? ""
            }
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Status
          </label>

          <select
            name="status"
            defaultValue={sport.status}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
          >
            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
          <Link
            href="/admin/sports"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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