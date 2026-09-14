"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";

function optionalDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw ? new Date(raw).toISOString() : null;
}

export async function createAnnouncement(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const gamesEditionId = String(formData.get("games_edition_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const priority = String(formData.get("priority") ?? "normal");
  const startsAt = optionalDate(formData.get("starts_at"));
  const expiresAt = optionalDate(formData.get("expires_at"));
  const isPublished = formData.get("is_published") === "on";

  if (!gamesEditionId) throw new Error("Games Edition is required.");
  if (!title) throw new Error("Announcement title is required.");
  if (!body) throw new Error("Announcement message is required.");
  if (!["normal", "important", "urgent"].includes(priority)) {
    throw new Error("Invalid announcement priority.");
  }
  if (startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
    throw new Error("Expiry must be after the start time.");
  }

  const { error } = await supabase.from("announcements").insert({
    games_edition_id: gamesEditionId,
    title,
    body,
    priority,
    starts_at: startsAt,
    expires_at: expiresAt,
    is_published: isPublished,
    published_at: isPublished ? new Date().toISOString() : null,
    created_by: profile.id,
    updated_by: profile.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath("/");
}

export async function toggleAnnouncementPublication(
  announcementId: string,
  formData: FormData
) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const publish = String(formData.get("publish") ?? "false") === "true";

  const { error } = await supabase
    .from("announcements")
    .update({
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq("id", announcementId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath("/");
}

export async function deleteAnnouncement(announcementId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", announcementId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath("/");
}
