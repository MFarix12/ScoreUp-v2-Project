"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function saveSchedulingRules(
  competitionId: string,
  formData: FormData
) {
  await requireAdmin();

  const supabase = await createClient();

  const duration = Number(
    formData.get(
      "default_match_duration_minutes"
    )
  );

  const minimumRest = Number(
    formData.get(
      "minimum_rest_minutes"
    )
  );

  const allowBackToBack =
    formData.get(
      "allow_back_to_back"
    ) === "on";

  const allowSameDay =
    formData.get(
      "allow_same_day_multiple_matches"
    ) === "on";

  if (
    !Number.isInteger(duration) ||
    duration <= 0
  ) {
    throw new Error(
      "Match duration must be greater than 0."
    );
  }

  if (
    !Number.isInteger(minimumRest) ||
    minimumRest < 0
  ) {
    throw new Error(
      "Minimum rest must be 0 or greater."
    );
  }

  const { error } = await supabase
    .from(
      "competition_scheduling_rules"
    )
    .upsert(
      {
        competition_id:
          competitionId,

        default_match_duration_minutes:
          duration,

        minimum_rest_minutes:
          minimumRest,

        allow_back_to_back:
          allowBackToBack,

        allow_same_day_multiple_matches:
          allowSameDay,
      },
      {
        onConflict:
          "competition_id",
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(
    `/admin/competitions/${competitionId}/scheduling`
  );
}