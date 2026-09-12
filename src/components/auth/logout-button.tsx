"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="
        rounded-xl border border-slate-200
        bg-white px-4 py-2
        text-sm font-semibold text-[#111827]
        transition
        hover:border-[#E30613]
        hover:text-[#E30613]
      "
    >
      Logout
    </button>
  );
}