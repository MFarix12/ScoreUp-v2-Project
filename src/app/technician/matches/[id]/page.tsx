import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { submitMatchResult } from "../actions";

interface MatchResultPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MatchResultPage({
  params,
}: MatchResultPageProps) {
  const { id } = await params;

  const supabase =
    await createClient();

  // =====================================================
  // LOAD MATCH
  // =====================================================

  const {
    data: match,
    error,
  } = await supabase
    .from("matches")
    .select(`
      id,
      match_code,
      status,
      stage_id,
      home_participant_id,
      away_participant_id,

      competitions (
        name
      ),

      competition_stages (
        id,
        name,
        stage_type
      ),

      tournament_rounds (
        name
      ),

      home:competition_participants!matches_home_participant_fk (
        id,

        teams (
          name
        )
      ),

      away:competition_participants!matches_away_participant_fk (
        id,

        teams (
          name
        )
      ),

      match_results (
        id,
        result_status
      )
    `)
    .eq("id", id)
    .single();

  if (
    error ||
    !match
  ) {
    notFound();
  }

  // =====================================================
  // MATCH MUST HAVE BOTH PARTICIPANTS
  // =====================================================

  if (
    !match.home_participant_id ||
    !match.away_participant_id
  ) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-xl font-bold text-[#111827]">
            Match Not Ready
          </h1>

          <p className="mt-2 text-sm text-amber-800">
            Both participants must be determined before
            a result can be entered.
          </p>

          <Link
            href="/technician/matches"
            className="mt-6 inline-block font-semibold text-[#E30613] hover:underline"
          >
            Return to Matches
          </Link>
        </div>
      </div>
    );
  }

  // =====================================================
  // EXISTING RESULT CHECK
  // =====================================================

  const existingResult =
    match.match_results?.some(
      (result) =>
        result.result_status ===
          "pending_validation" ||
        result.result_status ===
          "official"
    );

  if (existingResult) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-xl font-bold text-[#111827]">
            Result Already Submitted
          </h1>

          <p className="mt-2 text-sm text-amber-800">
            This match already has a pending or
            official result.
          </p>

          <Link
            href="/technician/matches"
            className="mt-6 inline-block font-semibold text-[#E30613] hover:underline"
          >
            Return to Matches
          </Link>
        </div>
      </div>
    );
  }

  // =====================================================
  // STAGE INFORMATION
  // =====================================================

  const stageType =
    match.competition_stages?.stage_type;

  const allowsDraw =
    stageType === "group" ||
    stageType === "round_robin";

  const submitAction =
    submitMatchResult.bind(
      null,
      match.id
    );

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] placeholder:text-slate-400 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100";

  return (
    <div className="mx-auto max-w-3xl">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-8">
        <Link
          href="/technician/matches"
          className="text-sm font-semibold text-[#E30613] hover:underline"
        >
          ← Back to Matches
        </Link>

        <div className="mb-3 mt-5 h-1 w-12 rounded-full bg-[#E30613]" />

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold text-[#111827]">
              Enter Match Result
            </h1>

            <p className="mt-2 text-slate-500">
              {match.competitions?.name}
              {" · "}
              {match.tournament_rounds
                ?.name ??
                match.competition_stages
                  ?.name ??
                "Match"}
              {" · "}
              {match.match_code}
            </p>
          </div>

          <StageBadge
            allowsDraw={
              allowsDraw
            }
          />
        </div>
      </div>

      {/* =================================================
          RESULT FORM
      ================================================= */}

      <form
        action={submitAction}
        className="space-y-7 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        {/* ===============================================
            SCORE
        =============================================== */}

        <div className="grid gap-5 md:grid-cols-2">
          {/* HOME */}

          <div className="rounded-xl border border-slate-200 bg-[#F5F6F8] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Home
            </p>

            <h2 className="mt-2 text-lg font-bold text-[#111827]">
              {match.home?.teams?.name}
            </h2>

            <label className="mt-5 block text-sm font-semibold text-[#111827]">
              Score
            </label>

            <input
              type="number"
              name="home_score"
              min="0"
              step="1"
              required
              placeholder="0"
              className={`${inputClass} mt-2 text-center text-2xl font-bold`}
            />
          </div>

          {/* AWAY */}

          <div className="rounded-xl border border-slate-200 bg-[#F5F6F8] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Away
            </p>

            <h2 className="mt-2 text-lg font-bold text-[#111827]">
              {match.away?.teams?.name}
            </h2>

            <label className="mt-5 block text-sm font-semibold text-[#111827]">
              Score
            </label>

            <input
              type="number"
              name="away_score"
              min="0"
              step="1"
              required
              placeholder="0"
              className={`${inputClass} mt-2 text-center text-2xl font-bold`}
            />
          </div>
        </div>

        {/* ===============================================
            RESULT BEHAVIOUR
        =============================================== */}

        {allowsDraw ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700">
                i
              </div>

              <div>
                <p className="font-semibold text-blue-950">
                  Group Stage Result
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  The winner will be determined automatically
                  from the score. Equal scores are recorded as
                  a draw.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <RuleChip>
                    Win = 3 pts
                  </RuleChip>

                  <RuleChip>
                    Draw = 1 pt
                  </RuleChip>

                  <RuleChip>
                    Loss = 0 pts
                  </RuleChip>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                Winner if score is tied
              </label>

              <select
                name="winner_participant_id"
                defaultValue=""
                className={inputClass}
              >
                <option value="">
                  Not required unless the final score is tied
                </option>

                <option
                  value={
                    match.home_participant_id
                  }
                >
                  {match.home?.teams?.name}
                </option>

                <option
                  value={
                    match.away_participant_id
                  }
                >
                  {match.away?.teams?.name}
                </option>
              </select>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                For a knockout match, ScoreUp automatically
                determines the winner when the scores are
                different. If the scores are tied after the
                recorded match score, select the team that
                advanced.
              </p>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
              <p className="font-semibold text-purple-950">
                Knockout Match
              </p>

              <p className="mt-1 text-sm leading-6 text-purple-800">
                A knockout match must have a winner before
                the result can become official and tournament
                progression can continue.
              </p>
            </div>
          </>
        )}

        {/* ===============================================
            NOTES
        =============================================== */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Notes
          </label>

          <textarea
            name="notes"
            rows={4}
            placeholder={
              allowsDraw
                ? "Optional match notes..."
                : "Optional notes, for example penalty shootout information..."
            }
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* ===============================================
            VALIDATION INFORMATION
        =============================================== */}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Result Validation
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-800">
            This result will be submitted to the Administrator
            for validation. Standings and tournament
            progression will only be updated after the result
            becomes official.
          </p>
        </div>

        {/* ===============================================
            ACTIONS
        =============================================== */}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/technician/matches"
            className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-[#111827] transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-xl bg-[#E30613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B0000C]"
          >
            Submit Result
          </button>
        </div>
      </form>
    </div>
  );
}

// =========================================================
// STAGE BADGE
// =========================================================

function StageBadge({
  allowsDraw,
}: {
  allowsDraw: boolean;
}) {
  if (allowsDraw) {
    return (
      <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
        Group Stage
      </span>
    );
  }

  return (
    <span className="w-fit rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
      Knockout
    </span>
  );
}

// =========================================================
// RULE CHIP
// =========================================================

function RuleChip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
      {children}
    </span>
  );
}