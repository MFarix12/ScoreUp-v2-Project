"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function createSport(formData: FormData) {
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

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const sportType = String(
    formData.get("sport_type") ?? ""
  );

  const status = String(
    formData.get("status") ?? "active"
  );

  if (!gamesEditionId) {
    throw new Error("Games Edition is required.");
  }

  if (!name) {
    throw new Error("Sport name is required.");
  }

  if (!code) {
    throw new Error("Sport code is required.");
  }

  if (
    !["team", "individual", "mixed"].includes(
      sportType
    )
  ) {
    throw new Error("Invalid sport type.");
  }

  const { error } = await supabase
    .from("sports")
    .insert({
      games_edition_id: gamesEditionId,
      name,
      code,
      description:
        description.length > 0 ? description : null,
      sport_type: sportType,
      status,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/sports");

  redirect("/admin/sports");
}

export async function updateSport(
  sportId: string,
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

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const sportType = String(
    formData.get("sport_type") ?? ""
  );

  const status = String(
    formData.get("status") ?? "active"
  );

  if (!gamesEditionId) {
    throw new Error("Games Edition is required.");
  }

  if (!name) {
    throw new Error("Sport name is required.");
  }

  if (!code) {
    throw new Error("Sport code is required.");
  }

  const { error } = await supabase
    .from("sports")
    .update({
      games_edition_id: gamesEditionId,
      name,
      code,
      description:
        description.length > 0 ? description : null,
      sport_type: sportType,
      status,
    })
    .eq("id", sportId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/sports");

  redirect("/admin/sports");
}