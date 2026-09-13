"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export type CorrectionActionState = {
  success: boolean;
  message: string;
};

const errorState = (
  message: string
): CorrectionActionState => ({
  success: false,
  message,
});

export async function correctResult(
  resultId: string,
  _previousState: CorrectionActionState,
  formData: FormData
): Promise<CorrectionActionState> {
  await requireAdmin();

  const supabase =
    await createClient();

  // =====================================================
  // 1. FORM VALUES
  // =====================================================

  const homeScoreRaw = String(
    formData.get("home_score") ?? ""
  ).trim();

  const awayScoreRaw = String(
    formData.get("away_score") ?? ""
  ).trim();

  const selectedWinnerId = String(
    formData.get(
      "winner_participant_id"
    ) ?? ""
  ).trim();

  const notes = String(
    formData.get("notes") ?? ""
  ).trim();

  // =====================================================
  // 2. BASIC VALIDATION
  // =====================================================

  if (
    homeScoreRaw === "" ||
    awayScoreRaw === ""
  ) {
    return errorState(
      "Please enter both home and away scores."
    );
  }

  const homeScore =
    Number(homeScoreRaw);

  const awayScore =
    Number(awayScoreRaw);

  if (
    !Number.isFinite(homeScore) ||
    !Number.isFinite(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    return errorState(
      "Scores must be valid non-negative numbers."
    );
  }

  if (!notes) {
    return errorState(
      "Please provide a reason for correcting this official result."
    );
  }

  // =====================================================
  // 3. LOAD ORIGINAL RESULT + MATCH
  // =====================================================

  const {
    data: result,
    error: resultError,
  } = await supabase
    .from("match_results")
    .select(`
      id,
      result_status,
      match_id,

      matches (
        id,
        competition_id,
        home_participant_id,
        away_participant_id,
        stage_id,

        competition_stages (
          id,
          stage_type
        )
      )
    `)
    .eq(
      "id",
      resultId
    )
    .single();

  if (
    resultError ||
    !result
  ) {
    return errorState(
      "The official result could not be found."
    );
  }

  if (
    result.result_status !==
    "official"
  ) {
    return errorState(
      "Only an official result can be corrected."
    );
  }

  if (!result.matches) {
    return errorState(
      "The match linked to this result could not be found."
    );
  }

  const match =
    result.matches;

  if (
    !match.home_participant_id ||
    !match.away_participant_id
  ) {
    return errorState(
      "Both participants must be known before the result can be corrected."
    );
  }

  const stageType =
    match.competition_stages
      ?.stage_type;

  const allowsDraw =
    stageType === "group" ||
    stageType === "round_robin";

  const isTie =
    homeScore === awayScore;

  let winnerParticipantId:
    string | null = null;

  let loserParticipantId:
    string | null = null;

  // =====================================================
  // 4. HANDLE TIED KNOCKOUT RESULT
  // =====================================================

  if (
    isTie &&
    !allowsDraw
  ) {
    if (!selectedWinnerId) {
      return errorState(
        "Please select the team that won the tied knockout match."
      );
    }

    if (
      selectedWinnerId !==
        match.home_participant_id &&
      selectedWinnerId !==
        match.away_participant_id
    ) {
      return errorState(
        "The selected winner does not belong to this match."
      );
    }

    winnerParticipantId =
      selectedWinnerId;

    loserParticipantId =
      selectedWinnerId ===
      match.home_participant_id
        ? match.away_participant_id
        : match.home_participant_id;
  }

  // =====================================================
  // 5. ANALYZE IMPACT AGAIN SERVER-SIDE
  //
  // Never trust the UI-only warning.
  // =====================================================

  const {
    data: impact,
    error: impactError,
  } = await supabase.rpc(
    "analyze_result_correction",
    {
      p_result_id:
        resultId,
    }
  );

  if (impactError) {
    console.error(
      "Correction impact error:",
      impactError
    );

    return errorState(
      "ScoreUp could not analyse the impact of this correction."
    );
  }

  if (
    impact?.manual_review_required ===
    true
  ) {
    return errorState(
      "This result cannot be corrected automatically because later competition data has already progressed. Manual review is required."
    );
  }

  // =====================================================
  // 6. PERFORM SAFE CORRECTION
  // =====================================================

  const {
    data: correctionResult,
    error: correctionError,
  } = await supabase.rpc(
    "correct_official_result",
    {
      p_result_id:
        resultId,

      p_home_score:
        homeScore,

      p_away_score:
        awayScore,

      p_winner_participant_id:
        winnerParticipantId,

      p_loser_participant_id:
        loserParticipantId,

      p_notes:
        notes,
    }
  );

  if (correctionError) {
    console.error(
      "Result correction error:",
      correctionError
    );

    const message =
      correctionError.message
        ?.toLowerCase() ?? "";

    if (
      message.includes(
        "manual review"
      )
    ) {
      return errorState(
        "This result can no longer be corrected automatically because downstream competition data has progressed."
      );
    }

    return errorState(
      "The result could not be corrected. No automatic correction has been completed."
    );
  }

  const competitionId =
    correctionResult
      ?.competition_id ??
    match.competition_id;

  // =====================================================
  // 7. REVALIDATE ADMIN
  // =====================================================

  revalidatePath(
    "/admin"
  );

  revalidatePath(
    "/admin/results"
  );

  revalidatePath(
    `/admin/results/${resultId}`
  );

  revalidatePath(
    "/admin/matches"
  );

  revalidatePath(
    "/admin/tournaments"
  );

  revalidatePath(
    "/admin/standings"
  );

  if (competitionId) {
    revalidatePath(
      `/admin/tournaments/${competitionId}`
    );

    revalidatePath(
      `/admin/competitions/${competitionId}`
    );
  }

  // =====================================================
  // 8. REVALIDATE TECHNICIAN
  // =====================================================

  revalidatePath(
    "/technician"
  );

  revalidatePath(
    "/technician/matches"
  );

  // =====================================================
  // 9. REVALIDATE PUBLIC
  // =====================================================

  revalidatePath("/");
  revalidatePath("/results");
  revalidatePath("/fixtures");
  revalidatePath("/schedule");
  revalidatePath("/standings");
  revalidatePath("/bracket");

  // =====================================================
  // 10. REDIRECT
  // =====================================================

  redirect(
    "/admin/results"
  );
}