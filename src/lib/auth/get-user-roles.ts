import { createClient } from "@/lib/supabase/server";

export async function getUserRoles(profileId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_roles")
    .select(`
      id,
      games_edition_id,
      roles (
        id,
        name,
        code
      )
    `)
    .eq("user_profile_id", profileId);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}