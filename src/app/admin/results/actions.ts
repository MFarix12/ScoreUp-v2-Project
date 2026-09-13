"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

// =========================================================
// APPROVE RESULT
// =========================================================

export async function approveResult(
  resultId: string
) {
  const profile =
    await requireAdmin();

  const supabase =
    await createClient();

  // =====================================================
  // 1. LOAD RESULT + MATCH + STAGE
  // =====================================================

  const {
    data: result,
    error: resultError,
  } = await supabase
    .from("match_results")
    .select(`
      id,
      match_id,
      result_status,
      home_score,
      away_score,
      winner_participant_id,
      loser_participant_id,

      matches (
        id,
        competition_id,
        match_code,
        status,
        stage_id,
        group_id,
        home_participant_id,
        away_participant_id,

        competition_stages (
          id,
          name,
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
    throw new Error(
      "Result could not be found."
    );
  }

  // =====================================================
  // 2. VALIDATE RESULT STATUS
  // =====================================================

  if (
    result.result_status !==
    "pending_validation"
  ) {
    throw new Error(
      "Only results awaiting validation can be approved."
    );
  }

  if (!result.matches) {
    throw new Error(
      "The match for this result could not be found."
    );
  }

  const competitionId =
    result.matches.competition_id;

  const stageId =
    result.matches.stage_id;

  if (!competitionId) {
    throw new Error(
      "The competition for this match could not be found."
    );
  }

  if (!stageId) {
    throw new Error(
      "The stage for this match could not be found."
    );
  }

  // =====================================================
  // 3. DETERMINE STAGE TYPE
  // =====================================================

  const stageType =
    result.matches
      .competition_stages
      ?.stage_type;

  const allowsDraw =
    stageType === "group" ||
    stageType === "round_robin";

  const isDraw =
    result.home_score ===
    result.away_score;

  // =====================================================
  // 4. VALIDATE WINNER / LOSER
  // =====================================================

  if (allowsDraw) {
    if (isDraw) {
      if (
        result.winner_participant_id ||
        result.loser_participant_id
      ) {
        throw new Error(
          "A drawn group-stage result must not contain a winner or loser."
        );
      }
    } else {
      if (
        !result.winner_participant_id ||
        !result.loser_participant_id
      ) {
        throw new Error(
          "Winner and loser must be defined for a group-stage result that is not a draw."
        );
      }
    }
  } else {
    if (
      !result.winner_participant_id ||
      !result.loser_participant_id
    ) {
      throw new Error(
        "A knockout result must have a winner and loser before it can be approved."
      );
    }
  }

  // =====================================================
  // 5. VALIDATE PARTICIPANT IDS
  // =====================================================

  if (
    result.winner_participant_id &&
    result.winner_participant_id !==
      result.matches
        .home_participant_id &&
    result.winner_participant_id !==
      result.matches
        .away_participant_id
  ) {
    throw new Error(
      "The selected winner does not belong to this match."
    );
  }

  if (
    result.loser_participant_id &&
    result.loser_participant_id !==
      result.matches
        .home_participant_id &&
    result.loser_participant_id !==
      result.matches
        .away_participant_id
  ) {
    throw new Error(
      "The selected loser does not belong to this match."
    );
  }

  if (
    result.winner_participant_id &&
    result.loser_participant_id &&
    result.winner_participant_id ===
      result.loser_participant_id
  ) {
    throw new Error(
      "The winner and loser cannot be the same participant."
    );
  }

  // =====================================================
  // 6. MAKE RESULT OFFICIAL
  // =====================================================

  const now =
    new Date().toISOString();

  const {
    error: updateError,
  } = await supabase
    .from("match_results")
    .update({
      result_status:
        "official",

      validated_by:
        profile.id,

      validated_at:
        now,

      official_at:
        now,
    })
    .eq(
      "id",
      resultId
    )
    .eq(
      "result_status",
      "pending_validation"
    );

  if (updateError) {
    throw new Error(
      updateError.message
    );
  }

  // =====================================================
  // 7. MARK MATCH COMPLETED
  // =====================================================

  const {
    error: matchError,
  } = await supabase
    .from("matches")
    .update({
      status:
        "completed",
    })
    .eq(
      "id",
      result.match_id
    );

  if (matchError) {
    throw new Error(
      matchError.message
    );
  }

  // =====================================================
  // 8. GROUP / ROUND ROBIN LOGIC
  // =====================================================

  if (allowsDraw) {
    const groupId =
      result.matches.group_id;

    if (!groupId) {
      throw new Error(
        "This group-stage match is not assigned to a competition group."
      );
    }

    // ---------------------------------------------------
    // 8A. RECALCULATE STANDINGS
    // ---------------------------------------------------

    const {
      error: standingsError,
    } = await supabase.rpc(
      "recalculate_group_standings",
      {
        p_group_id:
          groupId,
      }
    );

    if (standingsError) {
      throw new Error(
        `Result became official, but group standings could not be recalculated: ${standingsError.message}`
      );
    }

    // ---------------------------------------------------
    // 8B. PROCESS QUALIFICATION
    // ---------------------------------------------------

    const {
      error: qualificationError,
    } = await supabase.rpc(
      "process_group_qualification",
      {
        p_stage_id:
          stageId,
      }
    );

    if (qualificationError) {
      throw new Error(
        `Result became official and standings were updated, but group qualification could not be processed: ${qualificationError.message}`
      );
    }
  }

  // =====================================================
  // 9. KNOCKOUT / CLASSIFICATION LOGIC
  // =====================================================

  else {
    // ---------------------------------------------------
    // 9A. PROCESS WINNER / LOSER PROGRESSION
    // ---------------------------------------------------

    const {
      error: progressionError,
    } = await supabase.rpc(
      "process_match_progression",
      {
        p_result_id:
          resultId,
      }
    );

    if (progressionError) {
      throw new Error(
        `Result became official, but tournament progression failed: ${progressionError.message}`
      );
    }

    // ---------------------------------------------------
    // 9B. RECALCULATE FINAL PLACEMENTS
    //
    // Safe after every knockout result:
    // - semifinal -> awaiting final
    // - final only -> awaiting third place
    // - third only -> awaiting final
    // - both done -> placements created
    // ---------------------------------------------------

    const {
      error: placementsError,
    } = await supabase.rpc(
      "recalculate_competition_placements",
      {
        p_competition_id:
          competitionId,
      }
    );

    if (placementsError) {
      throw new Error(
        `Result became official, but final competition placements could not be recalculated: ${placementsError.message}`
      );
    }
  }

  // =====================================================
  // 10. REFRESH COMPETITION STATUS
  //
  // Lifecycle:
  //
  // scheduled
  //   ↓
  // first official result
  //   ↓
  // in_progress
  //
  // later, once all stages are completed and final
  // placements exist:
  //
  // in_progress
  //   ↓
  // completed
  // =====================================================

  const {
    data: statusResult,
    error: statusError,
  } = await supabase.rpc(
    "refresh_competition_status",
    {
      p_competition_id:
        competitionId,
    }
  );

  if (statusError) {
    throw new Error(
      `Result became official, but the competition status could not be refreshed: ${statusError.message}`
    );
  }

  console.log(
    "Competition status refreshed:",
    statusResult
  );

  // =====================================================
  // 11. REVALIDATE ADMIN
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
    `/admin/tournaments/${competitionId}`
  );

  revalidatePath(
    "/admin/competitions"
  );

  revalidatePath(
    `/admin/competitions/${competitionId}`
  );

  revalidatePath(
    "/admin/standings"
  );

  // =====================================================
  // 12. REVALIDATE TECHNICIAN
  // =====================================================

  revalidatePath(
    "/technician"
  );

  revalidatePath(
    "/technician/matches"
  );

  // =====================================================
  // 13. REVALIDATE PUBLIC
  // =====================================================

  revalidatePath(
    "/"
  );

  revalidatePath(
    "/results"
  );

  revalidatePath(
    "/fixtures"
  );

  revalidatePath(
    "/schedule"
  );

  revalidatePath(
    "/bracket"
  );

  revalidatePath(
    "/standings"
  );

  // =====================================================
  // 14. REDIRECT
  // =====================================================

  redirect(
    "/admin/results"
  );
}

// =========================================================
// REJECT RESULT
// =========================================================

export async function rejectResult(
  resultId: string,
  formData: FormData
) {
  await requireAdmin();

  const supabase =
    await createClient();

  // =====================================================
  // 1. REJECTION REASON
  // =====================================================

  const reason = String(
    formData.get("reason") ?? ""
  ).trim();

  if (!reason) {
    throw new Error(
      "A rejection reason is required."
    );
  }

  // =====================================================
  // 2. LOAD RESULT
  // =====================================================

  const {
    data: result,
    error: resultError,
  } = await supabase
    .from("match_results")
    .select(`
      id,
      result_status,
      notes
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
    throw new Error(
      "Result could not be found."
    );
  }

  // =====================================================
  // 3. ONLY PENDING RESULTS CAN BE REJECTED
  // =====================================================

  if (
    result.result_status !==
    "pending_validation"
  ) {
    throw new Error(
      "Only pending results can be rejected."
    );
  }

  // =====================================================
  // 4. BUILD REJECTION NOTE
  // =====================================================

  const existingNotes =
    result.notes?.trim() ?? "";

  const rejectionNote =
    `Rejected by Administrator: ${reason}`;

  // =====================================================
  // 5. CANCEL RESULT
  // =====================================================

  const {
    error,
  } = await supabase
    .from("match_results")
    .update({
      result_status:
        "cancelled",

      notes:
        existingNotes
          ? `${existingNotes}\n\n${rejectionNote}`
          : rejectionNote,
    })
    .eq(
      "id",
      resultId
    );

  if (error) {
    throw new Error(
      error.message
    );
  }

  // =====================================================
  // 6. REVALIDATE
  // =====================================================

  revalidatePath(
    "/admin/results"
  );

  revalidatePath(
    `/admin/results/${resultId}`
  );

  revalidatePath(
    "/technician/matches"
  );

  // =====================================================
  // 7. REDIRECT
  // =====================================================

  redirect(
    "/admin/results"
  );
}
