import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function requireAdmin() {
  const profile = await getCurrentUser();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_roles")
    .select(`
      id,
      roles (
        code
      )
    `)
    .eq("user_profile_id", profile.id);

  if (error) {
    throw new Error(error.message);
  }

  const isAdmin =
    data?.some((item) => item.roles?.code === "admin") ?? false;

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return profile;
}