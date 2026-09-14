"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  BookOpen,
  Megaphone,
  Gauge,
  Layers3,
  Medal,
  Menu,
  ShieldCheck,
  Swords,
  Trophy,
  UserRoundCog,
  UsersRound,
  X,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: Gauge },
  { name: "Games Editions", href: "/admin/editions", icon: CalendarDays },
  { name: "Sports", href: "/admin/sports", icon: Trophy },
  { name: "Teams", href: "/admin/teams", icon: UsersRound },
  { name: "Venues", href: "/admin/venues", icon: Layers3 },
  { name: "Competitions", href: "/admin/competitions", icon: Swords },
  { name: "Participants", href: "/admin/participants", icon: UsersRound },
  { name: "Tournament", href: "/admin/tournaments", icon: Trophy },
  { name: "Matches", href: "/admin/matches", icon: CalendarDays },
  { name: "Results", href: "/admin/results", icon: ClipboardList },
  { name: "Standings", href: "/admin/standings", icon: BarChart3 },
  { name: "Medal Table", href: "/admin/medals", icon: Medal },
  { name: "Rules", href: "/admin/rules", icon: BookOpen },
  { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { name: "Users", href: "/admin/users", icon: UserRoundCog },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E30613] text-base font-black text-white shadow-lg shadow-red-950/20">
        S
      </div>

      <div className="min-w-0">
        <h1 className="truncate text-xl font-black tracking-tight text-white">
          Score<span className="text-[#E30613]">Up</span>
        </h1>
        <p className="truncate text-xs font-medium text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function NavigationLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1.5 p-4" aria-label="Administrator navigation">
      {navigation.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              active
                ? "bg-[#E30613] text-white shadow-lg shadow-red-950/20"
                : "text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Icon
              className={`h-[18px] w-[18px] shrink-0 ${
                active ? "text-white" : "text-slate-400 group-hover:text-white"
              }`}
            />
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            {active && <ChevronRight className="h-4 w-4 shrink-0 opacity-80" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar({ profileName }: { profileName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col overflow-y-auto bg-[#111827] text-white lg:flex">
        <div className="border-b border-white/10 px-6 py-6">
          <Brand subtitle="Administration Console" />
        </div>

        <div className="flex-1 overflow-y-auto">
          <NavigationLinks pathname={pathname} />
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-200">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{profileName}</p>
                <p className="text-xs font-medium text-red-300">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E30613] text-sm font-black text-white">
            S
          </div>
          <div>
            <p className="text-base font-black leading-none text-[#111827]">
              Score<span className="text-[#E30613]">Up</span>
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Admin
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#111827] shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-[#E30613]"
          aria-label="Open administrator navigation"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close administrator navigation"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col bg-[#111827] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <Brand subtitle="Administration Console" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-slate-300 transition hover:bg-white/15 hover:text-white"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <NavigationLinks
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>

            <div className="space-y-3 border-t border-white/10 p-4">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="truncate text-sm font-bold text-white">{profileName}</p>
                <p className="mt-1 text-xs font-semibold text-red-300">Administrator</p>
              </div>
              <LogoutButton fullWidth />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
