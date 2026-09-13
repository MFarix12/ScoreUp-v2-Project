import { ReactNode } from "react";

import { TechnicianSidebar } from "@/components/technician/technician-sidebar";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireTechnician } from "@/lib/auth/require-technician";

export default async function TechnicianLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireTechnician();

  return (
    <div className="flex min-h-screen bg-[#F5F6F8]">
      <TechnicianSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <p className="text-sm font-medium text-slate-500">
            ScoreUp Sports Operations
          </p>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#111827]">
                {profile.full_name}
              </p>

              <p className="text-xs font-medium text-[#E30613]">
                Sports Technician
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