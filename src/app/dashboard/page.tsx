import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function DashboardPage() {
  const profile = await getCurrentUser();

  const supabase = await createClient();

  const { data: userRoles, error } = await supabase
    .from("user_roles")
    .select(`
      id,
      games_edition_id,
      roles (
        code
      )
    `)
    .eq("user_profile_id", profile.id);

  if (error) {
    throw new Error(error.message);
  }

  const roleCodes =
    userRoles
      ?.map((item) => {
        const role = item.roles;

        if (Array.isArray(role)) {
          return role[0]?.code;
        }

        return role?.code;
      })
      .filter(Boolean) ?? [];

  // Administrator
  if (roleCodes.includes("admin")) {
    redirect("/admin");
  }

  // Sports Technician
  if (roleCodes.includes("sports_technician")) {
    redirect("/technician");
  }

  // Authenticated but no valid ScoreUp role
  redirect("/unauthorized");
}