"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";

function optionalId(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export async function createRule(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const gamesEditionId = String(formData.get("games_edition_id") ?? "").trim();
  const sportId = optionalId(formData.get("sport_id"));
  const competitionId = optionalId(formData.get("competition_id"));
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const isPublished = formData.get("is_published") === "on";

  if (!gamesEditionId) throw new Error("Games Edition is required.");
  if (!title) throw new Error("Rule title is required.");
  if (!content) throw new Error("Rule content is required.");
  if (!Number.isInteger(sortOrder)) throw new Error("Sort order must be a whole number.");

  const { error } = await supabase.from("competition_rules").insert({
    games_edition_id: gamesEditionId,
    sport_id: sportId,
    competition_id: competitionId,
    title,
    content,
    sort_order: sortOrder,
    is_published: isPublished,
    published_at: isPublished ? new Date().toISOString() : null,
    created_by: profile.id,
    updated_by: profile.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/rules");
  revalidatePath("/rules");
}

export async function toggleRulePublication(ruleId: string, formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const publish = String(formData.get("publish") ?? "false") === "true";

  const { error } = await supabase
    .from("competition_rules")
    .update({
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq("id", ruleId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/rules");
  revalidatePath("/rules");
}

export async function deleteRule(ruleId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("competition_rules").delete().eq("id", ruleId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/rules");
  revalidatePath("/rules");
}
