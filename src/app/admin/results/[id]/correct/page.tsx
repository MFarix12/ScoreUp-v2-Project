import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ResultCorrectionForm } from "@/components/admin/result-correction-form";
import { correctResult } from "./actions";

interface CorrectResultPageProps {
  params: Promise<{ id: string }>;
}

export default async function CorrectResultPage({ params }: CorrectResultPageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from("match_results")
    .select(`
      id,
      home_score,
      away_score,
      result_status,
      matches (
        id,
        match_code,
        competition_id,
        home_participant_id,
        away_participant_id,
        competitions (
          id,
          name,
          sports ( id, name )
        ),
        competition_stages (
          id,
          name,
          stage_type
        ),
        tournament_rounds (
          id,
          name
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !result || !result.matches) {
    notFound();
  }

  const match = result.matches;

  if (!match.home_participant_id || !match.away_participant_id) {
    notFound();
  }

  const { data: participants, error: participantsError } = await supabase
    .from("competition_participants")
    .select(`
      id,
      teams (
        id,
        name,
        code
      )
    `)
    .in("id", [match.home_participant_id, match.away_participant_id]);

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  const homeParticipant = participants?.find((item) => item.id === match.home_participant_id);
  const awayParticipant = participants?.find((item) => item.id === match.away_participant_id);

  if (!homeParticipant || !awayParticipant) {
    notFound();
  }

  const { data: impact, error: impactError } = await supabase.rpc(
    "analyze_result_correction",
    { p_result_id: id }
  );

  const impactAvailable = !impactError && impact;
  const manualReviewRequired = impactAvailable
    ? impact.manual_review_required === true
    : true;

  const isOfficial = result.result_status === "official";
  const canCorrect = isOfficial && !manualReviewRequired;
  const allowsDraw =
    match.competition_stages?.stage_type === "group" ||
    match.competition_stages?.stage_type === "round_robin";

  const homeName = homeParticipant.teams?.name ?? "Home Team";
  const awayName = awayParticipant.teams?.name ?? "Away Team";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/admin/results/${id}`}
        className="inline-flex text-sm font-bold text-[#E30613] hover:underline"
      >
        ← Back to Result
      </Link>

      <section className="overflow-hidden rounded-3xl bg-[#111827] p-6 text-white shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">
          Official Result Correction
        </p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">Correct Match Result</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Preserve the original official record while safely creating a corrected replacement.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-white/10 px-3 py-1.5">{match.competitions?.sports?.name ?? "Sport"}</span>
          <span className="rounded-full bg-white/10 px-3 py-1.5">{match.competitions?.name ?? "Competition"}</span>
          <span className="rounded-full bg-white/10 px-3 py-1.5">{match.tournament_rounds?.name ?? match.competition_stages?.name ?? "Match"}</span>
          {match.match_code && <span className="rounded-full bg-[#E30613] px-3 py-1.5">{match.match_code}</span>}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#E30613]">Current Official Result</p>
        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="text-center">
            <p className="text-sm font-bold text-slate-500">{homeName}</p>
            <p className="mt-2 text-4xl font-black text-[#111827]">{result.home_score ?? "-"}</p>
          </div>
          <span className="font-black text-slate-300">VS</span>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-500">{awayName}</p>
            <p className="mt-2 text-4xl font-black text-[#111827]">{result.away_score ?? "-"}</p>
          </div>
        </div>
      </section>

      <section className={`rounded-3xl border p-6 ${canCorrect ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
        <h2 className={`font-black ${canCorrect ? "text-emerald-950" : "text-amber-950"}`}>
          {canCorrect ? "Automatic Correction Available" : "Manual Review Required"}
        </h2>
        <p className={`mt-2 text-sm leading-6 ${canCorrect ? "text-emerald-800" : "text-amber-800"}`}>
          {!isOfficial
            ? "Only the current official result can be corrected."
            : impactError
              ? "ScoreUp could not verify correction safety, so automatic correction is disabled."
              : manualReviewRequired
                ? "Later competition data has already progressed. ScoreUp will not automatically change this result."
                : "ScoreUp can safely create a corrected official result and recalculate the affected competition data."}
        </p>
      </section>

      {canCorrect && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="text-xl font-black text-[#111827]">Enter Corrected Result</h2>
          <p className="mt-2 text-sm text-slate-500">
            The current official result will be retained as correction history.
          </p>
          <div className="mt-6">
            <ResultCorrectionForm
              resultId={id}
              currentHomeScore={result.home_score}
              currentAwayScore={result.away_score}
              home={{ id: homeParticipant.id, name: homeName }}
              away={{ id: awayParticipant.id, name: awayName }}
              allowsDraw={allowsDraw}
              action={correctResult}
            />
          </div>
        </section>
      )}
    </div>
  );
}
