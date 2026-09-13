"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

const venueTypes = [
  "court",
  "field",
  "track",
  "pool",
  "hall",
  "room",
  "other",
];

export async function createVenue(
  formData: FormData
) {
  await requireAdmin();

  const supabase = await createClient();

  const gamesEditionId = String(
    formData.get("games_edition_id") ?? ""
  );

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const code = String(
    formData.get("code") ?? ""
  )
    .trim()
    .toUpperCase();

  const venueType = String(
    formData.get("venue_type") ?? ""
  );

  const locationDescription = String(
    formData.get("location_description") ?? ""
  ).trim();

  const capacityValue = String(
    formData.get("capacity") ?? ""
  ).trim();

  const status = String(
    formData.get("status") ?? "active"
  );

  if (!gamesEditionId) {
    throw new Error(
      "Games Edition is required."
    );
  }

  if (!name) {
    throw new Error(
      "Venue name is required."
    );
  }

  if (!code) {
    throw new Error(
      "Venue code is required."
    );
  }

  if (!venueTypes.includes(venueType)) {
    throw new Error(
      "Invalid venue type."
    );
  }

  let capacity: number | null = null;

  if (capacityValue) {
    capacity = Number(capacityValue);

    if (
      !Number.isInteger(capacity) ||
      capacity < 0
    ) {
      throw new Error(
        "Capacity must be a valid whole number."
      );
    }
  }

  const { error } = await supabase
    .from("venues")
    .insert({
      games_edition_id:
        gamesEditionId,

      name,
      code,

      venue_type: venueType,

      location_description:
        locationDescription || null,

      capacity,

      status,
    });

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "A venue with this code already exists for the selected Games Edition."
      );
    }

    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/venues");

  redirect("/admin/venues");
}


export async function updateVenue(
  venueId: string,
  formData: FormData
) {
  await requireAdmin();

  const supabase = await createClient();

  const gamesEditionId = String(
    formData.get("games_edition_id") ?? ""
  );

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const code = String(
    formData.get("code") ?? ""
  )
    .trim()
    .toUpperCase();

  const venueType = String(
    formData.get("venue_type") ?? ""
  );

  const locationDescription = String(
    formData.get("location_description") ?? ""
  ).trim();

  const capacityValue = String(
    formData.get("capacity") ?? ""
  ).trim();

  const status = String(
    formData.get("status") ?? "active"
  );

  let capacity: number | null = null;

  if (capacityValue) {
    capacity = Number(capacityValue);

    if (
      !Number.isInteger(capacity) ||
      capacity < 0
    ) {
      throw new Error(
        "Capacity must be a valid whole number."
      );
    }
  }

  const { error } = await supabase
    .from("venues")
    .update({
      games_edition_id:
        gamesEditionId,

      name,
      code,

      venue_type: venueType,

      location_description:
        locationDescription || null,

      capacity,

      status,
    })
    .eq("id", venueId);

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "A venue with this code already exists for this Games Edition."
      );
    }

    throw new Error(error.message);
  }

  revalidatePath("/admin/venues");

  redirect("/admin/venues");
}