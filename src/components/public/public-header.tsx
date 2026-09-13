"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Trophy, X } from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Schedule", href: "/schedule" },
  { name: "Results", href: "/results" },
  { name: "Standings", href: "/standings" },
  { name: "Leaderboard", href: "/leaderboard" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#111827]/95 text-white shadow-lg shadow-slate-950/10 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="group flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E30613] text-white shadow-lg shadow-red-950/20 transition group-hover:scale-105">
            <Trophy className="h-5 w-5" />
          </div>

          <div>
            <div className="text-xl font-black tracking-tight">
              Score<span className="text-[#E30613]">Up</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              SuperUPSI Games
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  active
                    ? "bg-white text-[#111827]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/login"
          className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:border-red-400/30 hover:bg-[#E30613] lg:inline-flex"
        >
          Staff Login
        </Link>

        <button
          type="button"
          aria-label="Toggle public navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((current) => !current)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#111827] lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-5 py-5 sm:px-6">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold ${
                    active
                      ? "bg-[#E30613] text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.name}
                  {active && <span className="h-2 w-2 rounded-full bg-white" />}
                </Link>
              );
            })}

            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-3 flex w-full items-center justify-center rounded-xl border border-white/10 px-4 py-3.5 text-sm font-bold text-white"
            >
              Staff Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
