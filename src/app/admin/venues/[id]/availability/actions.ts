"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function addVenueAvailability(
  venueId: string,
  formData: FormData
) {
  await requireAdmin();

  const supabase = await createClient();

  const date = String(
    formData.get("available_date") ?? ""
  );

  const startTime = String(
    formData.get("start_time") ?? ""
  );

  const endTime = String(
    formData.get("end_time") ?? ""
  );

  const status = String(
    formData.get(
      "availability_status"
    ) ?? "available"
  );

  const reason = String(
    formData.get("reason") ?? ""
  ).trim();

  if (
    !date ||
    !startTime ||
    !endTime
  ) {
    throw new Error(
      "Date and time are required."
    );
  }

  if (startTime >= endTime) {
    throw new Error(
      "End time must be later than start time."
    );
  }

  const { error } = await supabase
    .from("venue_availability")
    .insert({
      venue_id: venueId,
      available_date: date,
      start_time: startTime,
      end_time: endTime,
      availability_status:
        status,
      reason: reason || null,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(
    `/admin/venues/${venueId}/availability`
  );
}