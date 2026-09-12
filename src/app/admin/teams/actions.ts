"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function createTeam(formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  const gamesEditionId = String(
    formData.get("games_edition_id") ?? ""
  );

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const shortName = String(
    formData.get("short_name") ?? ""
  ).trim();

  const code = String(
    formData.get("code") ?? ""
  )
    .trim()
    .toUpperCase();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const status = String(
    formData.get("status") ?? "active"
  );

  if (!gamesEditionId) {
    throw new Error("Games Edition is required.");
  }

  if (!name) {
    throw new Error("Team name is required.");
  }

  if (!code) {
    throw new Error("Team code is required.");
  }

  if (
    !["active", "inactive", "withdrawn"].includes(status)
  ) {
    throw new Error("Invalid team status.");
  }

  const { error } = await supabase
    .from("teams")
    .insert({
      games_edition_id: gamesEditionId,
      name,
      short_name: shortName || null,
      code,
      description: description || null,
      status,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/teams");

  redirect("/admin/teams");
}

export async function updateTeam(
  teamId: string,
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

  const shortName = String(
    formData.get("short_name") ?? ""
  ).trim();

  const code = String(
    formData.get("code") ?? ""
  )
    .trim()
    .toUpperCase();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const status = String(
    formData.get("status") ?? "active"
  );

  if (!gamesEditionId) {
    throw new Error("Games Edition is required.");
  }

  if (!name) {
    throw new Error("Team name is required.");
  }

  if (!code) {
    throw new Error("Team code is required.");
  }

  const { error } = await supabase
    .from("teams")
    .update({
      games_edition_id: gamesEditionId,
      name,
      short_name: shortName || null,
      code,
      description: description || null,
      status,
    })
    .eq("id", teamId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/teams");

  redirect("/admin/teams");
}