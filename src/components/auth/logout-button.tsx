"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    if (pending) {
      return;
    }

    setPending(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#111827] shadow-sm transition hover:border-[#E30613] hover:bg-red-50 hover:text-[#E30613] disabled:cursor-not-allowed disabled:opacity-60 ${
        fullWidth ? "w-full" : ""
      }`}
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Signing out..." : "Logout"}
    </button>
  );
}
