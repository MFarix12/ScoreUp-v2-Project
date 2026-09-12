"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

const allowedCompetitionTypes = [
  "team",
  "individual",
  "pair",
];

const allowedStatuses = [
  "draft",
  "setup",
  "scheduled",
  "in_progress",
  "completed",
  "archived",
];

export async function createCompetition(
  formData: FormData
) {
  await requireAdmin();

  const supabase = await createClient();

  const sportId = String(
    formData.get("sport_id") ?? ""
  );

  const tournamentFormatId = String(
    formData.get("tournament_format_id") ?? ""
  );

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const code = String(
    formData.get("code") ?? ""
  )
    .trim()
    .toUpperCase();

  const category = String(
    formData.get("category") ?? ""
  ).trim();

  const competitionType = String(
    formData.get("competition_type") ?? ""
  );

  const status = String(
    formData.get("status") ?? "draft"
  );

  const isMedalEvent =
    formData.get("is_medal_event") === "on";

  if (!sportId) {
    throw new Error("Sport is required.");
  }

  if (!tournamentFormatId) {
    throw new Error(
      "Tournament format is required."
    );
  }

  if (!name) {
    throw new Error(
      "Competition name is required."
    );
  }

  if (!code) {
    throw new Error(
      "Competition code is required."
    );
  }

  if (
    !allowedCompetitionTypes.includes(
      competitionType
    )
  ) {
    throw new Error(
      "Invalid competition type."
    );
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error(
      "Invalid competition status."
    );
  }

  const { error } = await supabase
    .from("competitions")
    .insert({
      sport_id: sportId,
      tournament_format_id:
        tournamentFormatId,
      name,
      code,
      category:
        category.length > 0 ? category : null,
      competition_type: competitionType,
      is_medal_event: isMedalEvent,
      status,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/competitions");

  redirect("/admin/competitions");
}

export async function updateCompetition(
  competitionId: string,
  formData: FormData
) {
  await requireAdmin();

  const supabase = await createClient();

  const sportId = String(
    formData.get("sport_id") ?? ""
  );

  const tournamentFormatId = String(
    formData.get("tournament_format_id") ?? ""
  );

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const code = String(
    formData.get("code") ?? ""
  )
    .trim()
    .toUpperCase();

  const category = String(
    formData.get("category") ?? ""
  ).trim();

  const competitionType = String(
    formData.get("competition_type") ?? ""
  );

  const status = String(
    formData.get("status") ?? "draft"
  );

  const isMedalEvent =
    formData.get("is_medal_event") === "on";

  if (!sportId) {
    throw new Error("Sport is required.");
  }

  if (!tournamentFormatId) {
    throw new Error(
      "Tournament format is required."
    );
  }

  if (!name) {
    throw new Error(
      "Competition name is required."
    );
  }

  if (!code) {
    throw new Error(
      "Competition code is required."
    );
  }

  if (
    !allowedCompetitionTypes.includes(
      competitionType
    )
  ) {
    throw new Error(
      "Invalid competition type."
    );
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error(
      "Invalid competition status."
    );
  }

  const { error } = await supabase
    .from("competitions")
    .update({
      sport_id: sportId,
      tournament_format_id:
        tournamentFormatId,
      name,
      code,
      category:
        category.length > 0 ? category : null,
      competition_type: competitionType,
      is_medal_event: isMedalEvent,
      status,
    })
    .eq("id", competitionId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/competitions");

  redirect("/admin/competitions");
}