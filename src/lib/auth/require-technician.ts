import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function requireTechnician() {
  const profile = await getCurrentUser();

  const supabase = await createClient();

  const { data: roles, error } = await supabase
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

  const roleCodes =
    roles
      ?.map((item) => {
        const role = item.roles;

        if (Array.isArray(role)) {
          return role[0]?.code;
        }

        return role?.code;
      })
      .filter(Boolean) ?? [];

  const isTechnician =
    roleCodes.includes("sports_technician");

  if (!isTechnician) {
    redirect("/dashboard");
  }

  return profile;
}