import { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-[#F5F6F8]">
      <AdminSidebar profileName={profile.full_name} />

      <div className="flex min-w-0 flex-1 flex-col pt-16 lg:pt-0">
        {/* Desktop Top Navigation */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur lg:flex">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              ScoreUp
            </p>
            <p className="mt-0.5 text-sm font-bold text-[#111827]">
              Administration Console
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-[#111827]">
                {profile.full_name}
              </p>
              <p className="text-xs font-semibold text-[#E30613]">
                Administrator
              </p>
            </div>

            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
