import Link from "next/link";
import { createEdition } from "../actions";

export default function NewEditionPage() {
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
          Create Games Edition
        </h1>

        <p className="mt-2 text-slate-500">
          Create a new SuperUPSI Games edition.
        </p>
      </div>

      <form
        action={createEdition}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Edition Name
          </label>

          <input
            id="name"
            name="name"
            required
            placeholder="SuperUPSI Games 2027"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="year"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Year
          </label>

          <input
            id="year"
            name="year"
            type="number"
            required
            min="2000"
            max="2100"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="start_date"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Start Date
            </label>

            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="end_date"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              End Date
            </label>

            <input
              id="end_date"
              name="end_date"
              type="date"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="status"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Status
          </label>

          <select
            id="status"
            name="status"
            defaultValue="draft"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
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

        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              className="h-4 w-4"
            />

            <span className="text-sm text-slate-700">
              Set as current active edition
            </span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_public"
              className="h-4 w-4"
            />

            <span className="text-sm text-slate-700">
              Make this edition publicly visible
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
          <Link
            href="/admin/editions"
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create Edition
          </button>
        </div>
      </form>
    </div>
  );
}