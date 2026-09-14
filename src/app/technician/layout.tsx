import { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { TechnicianSidebar } from "@/components/technician/technician-sidebar";
import { requireTechnician } from "@/lib/auth/require-technician";

export default async function TechnicianLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireTechnician();

  return (
    <div className="flex min-h-screen bg-[#F5F6F8]">
      <TechnicianSidebar profileName={profile.full_name} />

      <div className="flex min-w-0 flex-1 flex-col pt-16 lg:pt-0">
        {/* Desktop Top Navigation */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur lg:flex">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              ScoreUp
            </p>
            <p className="mt-0.5 text-sm font-bold text-[#111827]">
              Sports Operations
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-[#111827]">
                {profile.full_name}
              </p>
              <p className="text-xs font-semibold text-[#E30613]">
                Sports Technician
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
