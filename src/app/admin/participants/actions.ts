"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function registerTeamParticipant(
  formData: FormData
) {
  await requireAdmin();

  const supabase = await createClient();

  const competitionId = String(
    formData.get("competition_id") ?? ""
  );

  const teamId = String(
    formData.get("team_id") ?? ""
  );

  const seedValue = String(
    formData.get("seed_number") ?? ""
  ).trim();

  const notes = String(
    formData.get("notes") ?? ""
  ).trim();

  if (!competitionId) {
    throw new Error("Competition is required.");
  }

  if (!teamId) {
    throw new Error("Team is required.");
  }

  const seedNumber =
    seedValue.length > 0
      ? Number(seedValue)
      : null;

  if (
    seedNumber !== null &&
    (!Number.isInteger(seedNumber) ||
      seedNumber <= 0)
  ) {
    throw new Error(
      "Seed number must be a positive integer."
    );
  }

  // -------------------------------------------------------
  // Validate competition
  // -------------------------------------------------------

  const {
    data: competition,
    error: competitionError,
  } = await supabase
    .from("competitions")
    .select(`
      id,
      competition_type,
      sports (
        games_edition_id
      )
    `)
    .eq("id", competitionId)
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
    competition.competition_type !== "team"
  ) {
    throw new Error(
      "This registration screen currently supports team competitions only."
    );
  }

  // -------------------------------------------------------
  // Validate team belongs to same Games Edition
  // -------------------------------------------------------

  const {
    data: team,
    error: teamError,
  } = await supabase
    .from("teams")
    .select(`
      id,
      games_edition_id,
      status
    `)
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    throw new Error("Team not found.");
  }

  if (team.status !== "active") {
    throw new Error(
      "Only active teams can be registered."
    );
  }

  const competitionEditionId =
    competition.sports?.games_edition_id;

  if (
    competitionEditionId !==
    team.games_edition_id
  ) {
    throw new Error(
      "The selected team does not belong to the same Games Edition as the competition."
    );
  }

  // -------------------------------------------------------
  // Prevent duplicate team entry
  // -------------------------------------------------------

  const {
    data: existingParticipant,
    error: existingError,
  } = await supabase
    .from("competition_participants")
    .select("id")
    .eq("competition_id", competitionId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      existingError.message
    );
  }

  if (existingParticipant) {
    throw new Error(
      "This team is already participating in the competition."
    );
  }

  // -------------------------------------------------------
  // Get Admin profile
  // -------------------------------------------------------

  const {
    data: {
      user,
    },
  } = await supabase.auth.getUser();

  let profileId: string | null = null;

  if (user) {
    const { data: profile } =
      await supabase
        .from("user_profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

    profileId = profile?.id ?? null;
  }

  // -------------------------------------------------------
  // Create approved registration
  // -------------------------------------------------------

  const {
    data: registration,
    error: registrationError,
  } = await supabase
    .from("competition_registrations")
    .insert({
      competition_id: competitionId,
      team_id: teamId,
      registration_type: "team",
      status: "approved",

      submitted_by: profileId,
      submitted_at: new Date().toISOString(),

      approved_by: profileId,
      approved_at: new Date().toISOString(),

      notes:
        notes.length > 0 ? notes : null,
    })
    .select("id")
    .single();

  if (
    registrationError ||
    !registration
  ) {
    throw new Error(
      registrationError?.message ??
        "Unable to create registration."
    );
  }

  // -------------------------------------------------------
  // Create tournament participant
  // -------------------------------------------------------

  const { error: participantError } =
    await supabase
      .from("competition_participants")
      .insert({
        competition_id: competitionId,
        registration_id: registration.id,
        team_id: teamId,
        participant_type: "team",
        seed_number: seedNumber,
        status: "active",
      });

  if (participantError) {
    throw new Error(
      participantError.message
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/participants");

  redirect("/admin/participants");
}