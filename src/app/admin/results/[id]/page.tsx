import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  approveResult,
  rejectResult,
} from "../actions";

interface ResultReviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResultReviewPage({
  params,
}: ResultReviewPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: result,
    error,
  } = await supabase
    .from("match_results")
    .select(`
      id,
      match_id,
      home_score,
      away_score,
      result_status,
      result_type,
      notes,
      submitted_at,
      validated_at,
      official_at,
      winner_participant_id,
      loser_participant_id,

      matches (
        id,
        match_code,
        status,

        competitions (
          name
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
        )
      ),

      submitted_profile:user_profiles!match_results_submitted_by_fk (
        full_name,
        email
      )
    `)
    .eq("id", id)
    .single();

  if (error || !result) {
    notFound();
  }

  const match = result.matches;

  const pending =
    result.result_status ===
    "pending_validation";

  const approveAction =
    approveResult.bind(null, result.id);

  const rejectAction =
    rejectResult.bind(null, result.id);

  const winnerName =
    result.winner_participant_id ===
    match?.home?.id
      ? match.home?.teams?.name
      : result.winner_participant_id ===
          match?.away?.id
        ? match.away?.teams?.name
        : "Unknown";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/results"
          className="text-sm font-semibold text-[#E30613] hover:underline"
        >
          ← Back to Results
        </Link>

        <div className="mb-3 mt-5 h-1 w-12 rounded-full bg-[#E30613]" />

        <h1 className="text-3xl font-bold text-[#111827]">
          Review Match Result
        </h1>

        <p className="mt-2 text-slate-500">
          {match?.competitions?.name}
          {" · "}
          {match?.tournament_rounds
            ?.name}
          {" · "}
          {match?.match_code}
        </p>
      </div>

      {/* Score */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-[#E30613]" />

        <div className="grid md:grid-cols-[1fr_auto_1fr]">
          <TeamScore
            label="Home"
            team={
              match?.home?.teams?.name ??
              "TBD"
            }
            score={result.home_score}
          />

          <div className="hidden items-center justify-center px-8 text-xl font-black text-slate-300 md:flex">
            VS
          </div>

          <TeamScore
            label="Away"
            team={
              match?.away?.teams?.name ??
              "TBD"
            }
            score={result.away_score}
            right
          />
        </div>
      </section>

      {/* Result Information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#111827]">
          Result Information
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Info
            label="Winner"
            value={winnerName}
          />

          <Info
            label="Result Type"
            value={result.result_type}
          />

          <Info
            label="Status"
            value={result.result_status}
          />

          <Info
            label="Submitted By"
            value={
              result.submitted_profile
                ?.full_name ??
              "Unknown"
            }
          />
        </div>

        {result.notes && (
          <div className="mt-6 rounded-xl bg-[#F5F6F8] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Technician Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {result.notes}
            </p>
          </div>
        )}
      </section>

      {/* Validation */}
      {pending && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#111827]">
            Validation Decision
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Confirm the submitted result before
            making it official.
          </p>

          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-900">
              Approving this result will trigger
              tournament progression.
            </p>

            <p className="mt-1 text-xs leading-5 text-green-700">
              If this is a knockout match,
              ScoreUp will automatically place the
              winner into the configured next-round
              bracket slot.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-5">
            {/* Approve */}
            <form action={approveAction}>
              <button
                type="submit"
                className="w-full rounded-xl bg-[#E30613] px-5 py-3 font-semibold text-white transition hover:bg-[#B0000C]"
              >
                Approve & Make Official
              </button>
            </form>

            {/* Reject */}
            <form
              action={rejectAction}
              className="rounded-xl border border-slate-200 p-5"
            >
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                Rejection Reason
              </label>

              <textarea
                name="reason"
                rows={3}
                required
                placeholder="Explain why this result should be rejected..."
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] placeholder:text-slate-400 outline-none focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
              />

              <div className="mt-4 text-right">
                <button
                  type="submit"
                  className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Reject Result
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {!pending && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          This result has already been processed.
        </div>
      )}
    </div>
  );
}

function TeamScore({
  label,
  team,
  score,
  right = false,
}: {
  label: string;
  team: string;
  score: number | null;
  right?: boolean;
}) {
  return (
    <div
      className={`p-8 ${
        right
          ? "border-t border-slate-100 md:border-l md:border-t-0"
          : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-xl font-bold text-[#111827]">
        {team}
      </p>

      <p className="mt-4 text-5xl font-black text-[#111827]">
        {score}
      </p>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-semibold capitalize text-[#111827]">
        {value.replaceAll("_", " ")}
      </p>
    </div>
  );
}