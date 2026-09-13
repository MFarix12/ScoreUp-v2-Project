import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { updateEdition } from "../../actions";

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
      .select(`
        id,
        name,
        year,
        start_date,
        end_date,
        status,
        is_active,
        is_public
      `)
      .eq("id", id)
      .single();

  if (error || !edition) {
    notFound();
  }

  /*
   * Explicit Server Action wrapper.
   *
   * We use this instead of:
   *
   * updateEdition.bind(null, edition.id)
   *
   * This ensures Next.js treats the function passed
   * to <form action={...}> as a Server Action.
   */
  async function handleUpdateEdition(
    formData: FormData
  ) {
    "use server";

    await updateEdition(
      edition.id,
      formData
    );
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] placeholder:text-slate-400 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100";

  return (
    <div className="mx-auto max-w-3xl">
      {/* ========================================
          PAGE HEADER
      ======================================== */}
      <div className="mb-8">
        <Link
          href="/admin/editions"
          className="text-sm font-semibold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
        >
          ← Back to Games Editions
        </Link>

        <div className="mb-3 mt-5 h-1 w-12 rounded-full bg-[#E30613]" />

        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
          Edit Games Edition
        </h1>

        <p className="mt-2 text-slate-500">
          Update the settings and public visibility
          for{" "}
          <span className="font-semibold text-[#111827]">
            {edition.name}
          </span>
          .
        </p>
      </div>

      {/* ========================================
          EDIT FORM
      ======================================== */}
      <form
        action={handleUpdateEdition}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        {/* Edition Name */}
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-semibold text-[#111827]"
          >
            Edition Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            defaultValue={edition.name}
            required
            className={inputClass}
          />
        </div>

        {/* Year */}
        <div>
          <label
            htmlFor="year"
            className="mb-2 block text-sm font-semibold text-[#111827]"
          >
            Year
          </label>

          <input
            id="year"
            name="year"
            type="number"
            min="2000"
            defaultValue={edition.year}
            required
            className={inputClass}
          />
        </div>

        {/* Dates */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="start_date"
              className="mb-2 block text-sm font-semibold text-[#111827]"
            >
              Start Date
            </label>

            <input
              id="start_date"
              name="start_date"
              type="date"
              defaultValue={
                edition.start_date
              }
              required
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="end_date"
              className="mb-2 block text-sm font-semibold text-[#111827]"
            >
              End Date
            </label>

            <input
              id="end_date"
              name="end_date"
              type="date"
              defaultValue={
                edition.end_date
              }
              required
              className={inputClass}
            />
          </div>
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
            defaultValue={edition.status}
            className={inputClass}
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

          <p className="mt-2 text-xs leading-5 text-slate-400">
            The lifecycle status of this SuperUPSI
            Games edition.
          </p>
        </div>

        {/* ========================================
            ACTIVE EDITION
        ======================================== */}
        <div className="rounded-2xl border border-slate-200 bg-[#F5F6F8] p-5">
          <label className="flex cursor-pointer items-start gap-4">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={
                edition.is_active
              }
              className="mt-1 h-4 w-4 accent-[#E30613]"
            />

            <div>
              <p className="text-sm font-semibold text-[#111827]">
                Current Active Edition
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Make this the current active
                SuperUPSI Games edition.
              </p>

              <p className="mt-2 text-xs font-medium text-[#E30613]">
                Only one Games Edition can be
                active at a time.
              </p>
            </div>
          </label>
        </div>

        {/* ========================================
            PUBLIC VISIBILITY
        ======================================== */}
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
          <label className="flex cursor-pointer items-start gap-4">
            <input
              type="checkbox"
              name="is_public"
              defaultChecked={
                edition.is_public
              }
              className="mt-1 h-4 w-4 accent-[#E30613]"
            />

            <div>
              <p className="text-sm font-semibold text-[#111827]">
                Publicly Visible
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Allow this edition to appear on the
                public ScoreUp portal.
              </p>

              {!edition.is_public && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-xs font-medium text-amber-700">
                    The public Schedule, Fixtures,
                    Results and Bracket pages cannot
                    display data from this edition
                    while public visibility is
                    disabled.
                  </p>
                </div>
              )}
            </div>
          </label>
        </div>

        {/* ========================================
            CURRENT STATE
        ======================================== */}
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Current Edition State
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge
              status={edition.status}
            />

            {edition.is_active ? (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Active Edition
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Not Active
              </span>
            )}

            {edition.is_public ? (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-[#E30613]">
                Public
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Private
              </span>
            )}
          </div>
        </div>

        {/* ========================================
            ACTIONS
        ======================================== */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/admin/editions"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-[#111827] transition hover:bg-slate-50"
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

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const label =
    status.replaceAll("_", " ");

  if (status === "active") {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold capitalize text-green-700">
        {label}
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold capitalize text-[#E30613]">
        {label}
      </span>
    );
  }

  if (status === "archived") {
    return (
      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
        {label}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-700">
      {label}
    </span>
  );
}