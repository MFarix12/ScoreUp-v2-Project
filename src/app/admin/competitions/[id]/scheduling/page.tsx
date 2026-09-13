import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { saveSchedulingRules } from "./actions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompetitionSchedulingPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const [
    competitionResult,
    rulesResult,
  ] = await Promise.all([
    supabase
      .from("competitions")
      .select(`
        id,
        name,
        code,
        sports (
          name
        )
      `)
      .eq("id", id)
      .single(),

    supabase
      .from("competition_scheduling_rules")
      .select("*")
      .eq("competition_id", id)
      .maybeSingle(),
  ]);

  if (
    competitionResult.error ||
    !competitionResult.data
  ) {
    notFound();
  }

  if (rulesResult.error) {
    throw new Error(
      rulesResult.error.message
    );
  }

  const competition =
    competitionResult.data;

  const rules =
    rulesResult.data;

  const saveAction =
    saveSchedulingRules.bind(
      null,
      competition.id
    );

  const inputClass =
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
          Scheduling Rules
        </h1>

        <p className="mt-2 text-slate-500">
          {competition.name}
          {" · "}
          {competition.sports?.name}
        </p>
      </div>

      <form
        action={saveAction}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Default Match Duration
          </label>

          <input
            name="default_match_duration_minutes"
            type="number"
            min="1"
            defaultValue={
              rules?.default_match_duration_minutes ??
              90
            }
            className={inputClass}
          />

          <p className="mt-2 text-xs text-slate-400">
            Duration in minutes.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Minimum Rest Time
          </label>

          <input
            name="minimum_rest_minutes"
            type="number"
            min="0"
            defaultValue={
              rules?.minimum_rest_minutes ??
              60
            }
            className={inputClass}
          />

          <p className="mt-2 text-xs text-slate-400">
            Minimum number of minutes a participant
            must rest between matches.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-[#F5F6F8] p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="allow_back_to_back"
              defaultChecked={
                rules?.allow_back_to_back ??
                false
              }
              className="mt-1 h-4 w-4 accent-[#E30613]"
            />

            <div>
              <p className="text-sm font-semibold text-[#111827]">
                Allow Back-to-Back Matches
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Allows a participant to start another
                match immediately after completing the
                previous match.
              </p>
            </div>
          </label>
        </div>

        <div className="rounded-xl border border-slate-200 bg-[#F5F6F8] p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="allow_same_day_multiple_matches"
              defaultChecked={
                rules
                  ?.allow_same_day_multiple_matches ??
                true
              }
              className="mt-1 h-4 w-4 accent-[#E30613]"
            />

            <div>
              <p className="text-sm font-semibold text-[#111827]">
                Allow Multiple Matches Per Day
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Allows the same participant to compete
                more than once on the same day.
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-6">
          <button
            type="submit"
            className="rounded-xl bg-[#E30613] px-5 py-3 text-sm font-semibold text-white hover:bg-[#B0000C]"
          >
            Save Scheduling Rules
          </button>
        </div>
      </form>
    </div>
  );
}