"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireTechnician } from "@/lib/auth/require-technician";

export async function submitMatchResult(
  matchId: string,
  formData: FormData
) {
  const profile = await requireTechnician();

  const supabase = await createClient();

  // =====================================================
  // 1. FORM VALUES
  // =====================================================

  const homeScore = Number(
    formData.get("home_score")
  );

  const awayScore = Number(
    formData.get("away_score")
  );

  const selectedWinnerId = String(
    formData.get("winner_participant_id") ?? ""
  ).trim();

  const notes = String(
    formData.get("notes") ?? ""
  ).trim();

  // =====================================================
  // 2. BASIC SCORE VALIDATION
  // =====================================================

  if (
    !Number.isFinite(homeScore) ||
    homeScore < 0 ||
    !Number.isInteger(homeScore)
  ) {
    throw new Error(
      "Home score must be a valid non-negative whole number."
    );
  }

  if (
    !Number.isFinite(awayScore) ||
    awayScore < 0 ||
    !Number.isInteger(awayScore)
  ) {
    throw new Error(
      "Away score must be a valid non-negative whole number."
    );
  }

  // =====================================================
  // 3. LOAD MATCH + STAGE
  // =====================================================

  const {
    data: match,
    error: matchError,
  } = await supabase
    .from("matches")
    .select(`
      id,
      competition_id,
      stage_id,
      home_participant_id,
      away_participant_id,
      status,

      competition_stages (
        id,
        name,
        stage_type
      )
    `)
    .eq("id", matchId)
    .single();

  if (
    matchError ||
    !match
  ) {
    throw new Error(
      "Match could not be found."
    );
  }

  if (
    !match.home_participant_id ||
    !match.away_participant_id
  ) {
    throw new Error(
      "Both match participants must be known before entering a result."
    );
  }

  // =====================================================
  // 4. DETERMINE MATCH TYPE
  // =====================================================

  const stageType =
    match.competition_stages?.stage_type;

  const allowsDraw =
    stageType === "group" ||
    stageType === "round_robin";

  // =====================================================
  // 5. DETERMINE WINNER / LOSER AUTOMATICALLY
  // =====================================================

  let winnerParticipantId:
    | string
    | null = null;

  let loserParticipantId:
    | string
    | null = null;

  // -----------------------------------------------------
  // Home wins
  // -----------------------------------------------------

  if (homeScore > awayScore) {
    winnerParticipantId =
      match.home_participant_id;

    loserParticipantId =
      match.away_participant_id;
  }

  // -----------------------------------------------------
  // Away wins
  // -----------------------------------------------------

  else if (awayScore > homeScore) {
    winnerParticipantId =
      match.away_participant_id;

    loserParticipantId =
      match.home_participant_id;
  }

  // -----------------------------------------------------
  // Scores are tied
  // -----------------------------------------------------

  else {
    // GROUP / ROUND ROBIN
    //
    // Draw is valid.
    // No winner and no loser.

    if (allowsDraw) {
      winnerParticipantId = null;
      loserParticipantId = null;
    }

    // KNOCKOUT / OTHER NON-DRAW STAGE
    //
    // A winner must be identified.
    // Example: penalty shootout.
    else {
      if (!selectedWinnerId) {
        throw new Error(
          "This knockout match is tied. Please select the team that advanced."
        );
      }

      if (
        selectedWinnerId !==
          match.home_participant_id &&
        selectedWinnerId !==
          match.away_participant_id
      ) {
        throw new Error(
          "Selected winner does not belong to this match."
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
  }

  // =====================================================
  // 6. CHECK EXISTING PENDING RESULT
  // =====================================================

  const {
    data: existingPending,
    error: pendingError,
  } = await supabase
    .from("match_results")
    .select("id")
    .eq(
      "match_id",
      matchId
    )
    .eq(
      "result_status",
      "pending_validation"
    )
    .maybeSingle();

  if (pendingError) {
    throw new Error(
      pendingError.message
    );
  }

  if (existingPending) {
    throw new Error(
      "This match already has a result awaiting validation."
    );
  }

  // =====================================================
  // 7. CHECK EXISTING OFFICIAL RESULT
  // =====================================================

  const {
    data: existingOfficial,
    error: officialError,
  } = await supabase
    .from("match_results")
    .select("id")
    .eq(
      "match_id",
      matchId
    )
    .eq(
      "result_status",
      "official"
    )
    .maybeSingle();

  if (officialError) {
    throw new Error(
      officialError.message
    );
  }

  if (existingOfficial) {
    throw new Error(
      "This match already has an official result."
    );
  }

  // =====================================================
  // 8. INSERT RESULT
  // =====================================================

  const {
    error: insertError,
  } = await supabase
    .from("match_results")
    .insert({
      match_id:
        matchId,

      home_score:
        homeScore,

      away_score:
        awayScore,

      winner_participant_id:
        winnerParticipantId,

      loser_participant_id:
        loserParticipantId,

      result_status:
        "pending_validation",

      result_type:
        "normal",

      notes:
        notes.length > 0
          ? notes
          : null,

      submitted_by:
        profile.id,

      submitted_at:
        new Date().toISOString(),
    });

  if (insertError) {
    console.error(
      "submitMatchResult insert error:",
      insertError
    );

    throw new Error(
      insertError.message
    );
  }

  // =====================================================
  // 9. REVALIDATE
  // =====================================================

  revalidatePath(
    "/technician"
  );

  revalidatePath(
    "/technician/matches"
  );

  revalidatePath(
    `/technician/matches/${matchId}`
  );

  revalidatePath(
    "/admin/results"
  );

  // =====================================================
  // 10. RETURN TO MATCH LIST
  // =====================================================

  redirect(
    "/technician/matches"
  );
}