import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { updateEdition } from "../../../actions";

interface EditEditionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEditionPage({
  params,
}: EditEditionPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: edition, error } =
    await supabase
      .from("games_editions")
      .select("*")
      .eq("id", id)
      .single();

  if (error || !edition) {
    notFound();
  }

  const updateAction =
    updateEdition.bind(null, edition.id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link
          href="/admin/editions"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Games Editions
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Edit Games Edition
        </h1>

        <p className="mt-2 text-slate-500">
          Update {edition.name}.
        </p>
      </div>

      <form
        action={updateAction}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Edition Name
          </label>

          <input
            name="name"
            defaultValue={edition.name}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Year
          </label>

          <input
            name="year"
            type="number"
            defaultValue={edition.year}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Start Date
            </label>

            <input
              name="start_date"
              type="date"
              defaultValue={edition.start_date}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              End Date
            </label>

            <input
              name="end_date"
              type="date"
              defaultValue={edition.end_date}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Status
          </label>

          <select
            name="status"
            defaultValue={edition.status}
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
          >
            <option value="draft">
              Draft
            </option>

            <option value="active">
              Active
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="archived">
              Archived
            </option>
          </select>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={edition.is_active}
          />

          <span className="text-sm text-slate-700">
            Current active edition
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_public"
            defaultChecked={edition.is_public}
          />

          <span className="text-sm text-slate-700">
            Publicly visible
          </span>
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
          <Link
            href="/admin/editions"
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}