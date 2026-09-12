import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  const authUserId = data.claims.sub;

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select(`
      id,
      full_name,
      email,
      status
    `)
    .eq("auth_user_id", authUserId)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  return profile;
}