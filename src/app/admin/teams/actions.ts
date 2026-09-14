"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

const TEAM_LOGO_BUCKET = "team-logos";
const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function validateStatus(status: string) {
  if (!["active", "inactive", "withdrawn"].includes(status)) {
    throw new Error("Invalid team status.");
  }
}

function readLogo(formData: FormData) {
  const value = formData.get("logo");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  if (!ALLOWED_LOGO_TYPES.has(value.type)) {
    throw new Error("Team logo must be a PNG, JPG, or WebP image.");
  }

  if (value.size > MAX_LOGO_SIZE) {
    throw new Error("Team logo must be 2 MB or smaller.");
  }

  return value;
}

function extensionFor(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

async function uploadTeamLogo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  file: File
) {
  const path = `${teamId}/${randomUUID()}.${extensionFor(file)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(TEAM_LOGO_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Team logo upload failed:", uploadError);
    throw new Error(
      "The team was not saved because its logo could not be uploaded. Please try again."
    );
  }

  const { data } = supabase.storage
    .from(TEAM_LOGO_BUCKET)
    .getPublicUrl(path);

  return {
    path,
    url: data.publicUrl,
  };
}

function revalidateTeamViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/teams");
  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/results");
  revalidatePath("/standings");
  revalidatePath("/leaderboard");
  revalidatePath("/fixtures");
  revalidatePath("/bracket");
}

export async function createTeam(formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  const gamesEditionId = String(
    formData.get("games_edition_id") ?? ""
  ).trim();

  const name = String(formData.get("name") ?? "").trim();
  const shortName = String(formData.get("short_name") ?? "").trim();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  const logo = readLogo(formData);

  if (!gamesEditionId) throw new Error("Games Edition is required.");
  if (!name) throw new Error("Team name is required.");
  if (!code) throw new Error("Team code is required.");
  validateStatus(status);

  const { data: team, error: insertError } = await supabase
    .from("teams")
    .insert({
      games_edition_id: gamesEditionId,
      name,
      short_name: shortName || null,
      code,
      description: description || null,
      status,
    })
    .select("id")
    .single();

  if (insertError || !team) {
    console.error("Create team failed:", insertError);
    throw new Error("The team could not be created. Check that the team code is unique and try again.");
  }

  if (logo) {
    try {
      const uploaded = await uploadTeamLogo(supabase, team.id, logo);

      const { error: logoUpdateError } = await supabase
        .from("teams")
        .update({
          logo_path: uploaded.path,
          logo_url: uploaded.url,
        })
        .eq("id", team.id);

      if (logoUpdateError) {
        await supabase.storage.from(TEAM_LOGO_BUCKET).remove([uploaded.path]);
        throw logoUpdateError;
      }
    } catch (error) {
      await supabase.from("teams").delete().eq("id", team.id);
      console.error("Create team logo transaction failed:", error);
      throw new Error("The team could not be created because its logo could not be saved.");
    }
  }

  revalidateTeamViews();
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
  ).trim();
  const name = String(formData.get("name") ?? "").trim();
  const shortName = String(formData.get("short_name") ?? "").trim();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  const removeLogo = formData.get("remove_logo") === "on";
  const logo = readLogo(formData);

  if (!gamesEditionId) throw new Error("Games Edition is required.");
  if (!name) throw new Error("Team name is required.");
  if (!code) throw new Error("Team code is required.");
  validateStatus(status);

  const { data: existingTeam, error: existingError } = await supabase
    .from("teams")
    .select("id,logo_path,logo_url")
    .eq("id", teamId)
    .single();

  if (existingError || !existingTeam) {
    throw new Error("Team could not be found.");
  }

  let nextLogoPath = existingTeam.logo_path ?? null;
  let nextLogoUrl = existingTeam.logo_url ?? null;
  let uploadedNewPath: string | null = null;

  if (logo) {
    const uploaded = await uploadTeamLogo(supabase, teamId, logo);
    nextLogoPath = uploaded.path;
    nextLogoUrl = uploaded.url;
    uploadedNewPath = uploaded.path;
  } else if (removeLogo) {
    nextLogoPath = null;
    nextLogoUrl = null;
  }

  const { error: updateError } = await supabase
    .from("teams")
    .update({
      games_edition_id: gamesEditionId,
      name,
      short_name: shortName || null,
      code,
      description: description || null,
      status,
      logo_path: nextLogoPath,
      logo_url: nextLogoUrl,
    })
    .eq("id", teamId);

  if (updateError) {
    if (uploadedNewPath) {
      await supabase.storage.from(TEAM_LOGO_BUCKET).remove([uploadedNewPath]);
    }

    console.error("Update team failed:", updateError);
    throw new Error("The team could not be updated. Check the entered details and try again.");
  }

  const oldLogoPath = existingTeam.logo_path ?? null;
  const logoWasReplaced = Boolean(uploadedNewPath && oldLogoPath);
  const logoWasRemoved = Boolean(removeLogo && !logo && oldLogoPath);

  if ((logoWasReplaced || logoWasRemoved) && oldLogoPath) {
    const { error: removeError } = await supabase.storage
      .from(TEAM_LOGO_BUCKET)
      .remove([oldLogoPath]);

    if (removeError) {
      console.error("Old team logo cleanup failed:", removeError);
    }
  }

  revalidateTeamViews();
  revalidatePath(`/admin/teams/${teamId}/edit`);
  redirect("/admin/teams");
}
