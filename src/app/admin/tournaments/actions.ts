"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

// =========================================================
// UPDATE PARTICIPANT SEEDS
// =========================================================

export async function updateParticipantSeeds(
  competitionId: string,
  formData: FormData
) {
  await requireAdmin();

  const supabase =
    await createClient();

  // =====================================================
  // 1. LOAD ACTIVE PARTICIPANTS
  // =====================================================

  const {
    data: participants,
    error: participantsError,
  } = await supabase
    .from("competition_participants")
    .select(`
      id,
      seed_number,
      status
    `)
    .eq(
      "competition_id",
      competitionId
    )
    .eq(
      "status",
      "active"
    );

  if (participantsError) {
    throw new Error(
      participantsError.message
    );
  }

  if (
    !participants ||
    participants.length === 0
  ) {
    throw new Error(
      "No active participants were found for this competition."
    );
  }

  // =====================================================
  // 2. READ SEED VALUES
  // =====================================================

  const seedAssignments: {
    participantId: string;
    seedNumber: number;
  }[] = [];

  for (
    const participant
    of participants
  ) {
    const rawSeed = String(
      formData.get(
        `seed_${participant.id}`
      ) ?? ""
    ).trim();

    if (!rawSeed) {
      throw new Error(
        "Every active participant must have a seed number."
      );
    }

    const seedNumber =
      Number(rawSeed);

    if (
      !Number.isInteger(
        seedNumber
      ) ||
      seedNumber <= 0
    ) {
      throw new Error(
        "Seed numbers must be positive integers."
      );
    }

    seedAssignments.push({
      participantId:
        participant.id,

      seedNumber,
    });
  }

  // =====================================================
  // 3. CHECK DUPLICATE SEEDS
  // =====================================================

  const seedNumbers =
    seedAssignments.map(
      (assignment) =>
        assignment.seedNumber
    );

  const uniqueSeeds =
    new Set(seedNumbers);

  if (
    uniqueSeeds.size !==
    seedNumbers.length
  ) {
    throw new Error(
      "Each participant must have a unique seed number."
    );
  }

  // =====================================================
  // 4. REQUIRE SEQUENTIAL SEEDS
  //
  // Example:
  //
  // 6 participants
  // must use:
  //
  // 1, 2, 3, 4, 5, 6
  // =====================================================

  const expectedSeeds =
    Array.from(
      {
        length:
          participants.length,
      },
      (_, index) =>
        index + 1
    );

  const sortedSeeds =
    [...seedNumbers].sort(
      (a, b) =>
        a - b
    );

  const validRange =
    expectedSeeds.every(
      (seed, index) =>
        seed ===
        sortedSeeds[index]
    );

  if (!validRange) {
    throw new Error(
      `Seed numbers must be sequential from 1 to ${participants.length}.`
    );
  }

  // =====================================================
  // 5. SAVE SEEDS
  // =====================================================

  for (
    const assignment
    of seedAssignments
  ) {
    const {
      error,
    } = await supabase
      .from(
        "competition_participants"
      )
      .update({
        seed_number:
          assignment.seedNumber,
      })
      .eq(
        "id",
        assignment.participantId
      )
      .eq(
        "competition_id",
        competitionId
      );

    if (error) {
      throw new Error(
        error.message
      );
    }
  }

  // =====================================================
  // 6. REFRESH STATUS
  //
  // Having active participants means the competition
  // may now move from draft → setup.
  // =====================================================

  const {
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
      `Seeds were saved, but the competition status could not be refreshed: ${statusError.message}`
    );
  }

  // =====================================================
  // 7. REVALIDATE
  // =====================================================

  revalidatePath(
    "/admin"
  );

  revalidatePath(
    "/admin/competitions"
  );

  revalidatePath(
    "/admin/tournaments"
  );

  revalidatePath(
    `/admin/tournaments/${competitionId}`
  );
}

// =========================================================
// GENERATE TOURNAMENT
// =========================================================

export async function generateTournament(
  competitionId: string
) {
  await requireAdmin();

  const supabase =
    await createClient();

  // =====================================================
  // 1. LOAD COMPETITION + FORMAT
  // =====================================================

  const {
    data: competition,
    error: competitionError,
  } = await supabase
    .from("competitions")
    .select(`
      id,
      name,
      status,
      tournament_format_id,

      tournament_formats (
        id,
        name,
        code
      )
    `)
    .eq(
      "id",
      competitionId
    )
    .single();

  if (
    competitionError ||
    !competition
  ) {
    throw new Error(
      "Competition could not be found."
    );
  }

  if (
    !competition
      .tournament_formats
  ) {
    throw new Error(
      "A tournament format must be selected before generating the tournament."
    );
  }

  // =====================================================
  // 2. PREVENT DUPLICATE GENERATION
  // =====================================================

  const {
    count: stageCount,
    error: stageError,
  } = await supabase
    .from("competition_stages")
    .select(
      "id",
      {
        count: "exact",
        head: true,
      }
    )
    .eq(
      "competition_id",
      competitionId
    );

  if (stageError) {
    throw new Error(
      stageError.message
    );
  }

  const {
    count: matchCount,
    error: matchError,
  } = await supabase
    .from("matches")
    .select(
      "id",
      {
        count: "exact",
        head: true,
      }
    )
    .eq(
      "competition_id",
      competitionId
    );

  if (matchError) {
    throw new Error(
      matchError.message
    );
  }

  if (
    (stageCount ?? 0) > 0 ||
    (matchCount ?? 0) > 0
  ) {
    throw new Error(
      "This tournament has already been generated."
    );
  }

  // =====================================================
  // 3. DETERMINE TOURNAMENT FORMAT
  // =====================================================

  const formatCode =
    competition
      .tournament_formats
      .code
      ?.trim()
      .toLowerCase()
      .replace(
        /[\s-]+/g,
        "_"
      ) ?? "";

  const formatName =
    competition
      .tournament_formats
      .name
      ?.trim()
      .toLowerCase() ??
    "";

  let generatorFunction:
    | "generate_single_elimination"
    | "generate_group_knockout";

  // =====================================================
  // SINGLE ELIMINATION
  // =====================================================

  if (
    formatCode ===
      "single_elimination" ||
    formatCode ===
      "knockout" ||
    formatName.includes(
      "single elimination"
    ) ||
    formatName ===
      "knockout"
  ) {
    generatorFunction =
      "generate_single_elimination";
  }

  // =====================================================
  // GROUP STAGE → KNOCKOUT
  // =====================================================

  else if (
    formatCode ===
      "group_knockout" ||
    formatCode ===
      "group_stage_knockout" ||
    formatCode ===
      "group_stage_to_knockout" ||
    (
      formatName.includes(
        "group"
      ) &&
      formatName.includes(
        "knockout"
      )
    )
  ) {
    generatorFunction =
      "generate_group_knockout";
  }

  // =====================================================
  // UNSUPPORTED FORMAT
  // =====================================================

  else {
    throw new Error(
      `Tournament generation is not yet supported for the selected format: ${competition.tournament_formats.name}.`
    );
  }

  // =====================================================
  // 4. GENERATE TOURNAMENT
  // =====================================================

  const {
    data: generationResult,
    error: generationError,
  } = await supabase.rpc(
    generatorFunction,
    {
      p_competition_id:
        competitionId,
    }
  );

  if (generationError) {
    throw new Error(
      `Tournament could not be generated: ${generationError.message}`
    );
  }

  console.log(
    "Tournament generated:",
    generationResult
  );

  // =====================================================
  // 5. REFRESH COMPETITION STATUS
  //
  // At this stage we now have:
  //
  // participants
  // stages
  // rounds
  // matches
  //
  // but normally no published schedules or official
  // results yet.
  //
  // Therefore:
  //
  // draft → setup
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
      `Tournament was generated, but the competition status could not be refreshed: ${statusError.message}`
    );
  }

  console.log(
    "Competition status refreshed:",
    statusResult
  );

  // =====================================================
  // 6. REVALIDATE ADMIN
  // =====================================================

  revalidatePath(
    "/admin"
  );

  revalidatePath(
    "/admin/competitions"
  );

  revalidatePath(
    `/admin/competitions/${competitionId}`
  );

  revalidatePath(
    "/admin/tournaments"
  );

  revalidatePath(
    `/admin/tournaments/${competitionId}`
  );

  revalidatePath(
    "/admin/matches"
  );

  // =====================================================
  // 7. REVALIDATE PUBLIC
  // =====================================================

  revalidatePath(
    "/"
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
  // 8. REDIRECT
  // =====================================================

  redirect(
    `/admin/tournaments/${competitionId}`
  );
}