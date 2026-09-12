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
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Navigation */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <p className="text-sm font-medium text-slate-500">
              ScoreUp Administration
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#111827]">
                {profile.full_name}
              </p>

              <p className="text-xs font-medium text-[#E30613]">
                Administrator
              </p>
            </div>

            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}