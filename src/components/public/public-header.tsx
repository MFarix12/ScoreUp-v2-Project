"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Schedule", href: "/schedule" },
  { name: "Fixtures", href: "/fixtures" },
  { name: "Bracket", href: "/bracket" },
  { name: "Results", href: "/results" },
  { name: "Standings", href: "/standings",}
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="group flex items-center gap-3"
        >
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#E30613] shadow-lg shadow-red-600/20 transition group-hover:scale-105">
            <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white/15" />

            <span className="relative text-lg font-black text-white">
              S
            </span>
          </div>

          <div>
            <div className="text-xl font-black tracking-tight text-[#111827]">
              Score
              <span className="text-[#E30613]">Up</span>
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              SuperUPSI Games
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-red-50 text-[#E30613]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#111827]"
                }`}
              >
                {item.name}

                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[#E30613]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Staff Login */}
        <div className="hidden lg:block">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#E30613] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-[#B0000C] hover:shadow-xl"
          >
            Staff Login
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Mobile Menu */}
        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((current) => !current)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#111827] transition hover:bg-slate-50 lg:hidden"
        >
          <div className="space-y-1.5">
            <span
              className={`block h-0.5 w-5 bg-current transition ${
                mobileOpen
                  ? "translate-y-2 rotate-45"
                  : ""
              }`}
            />

            <span
              className={`block h-0.5 w-5 bg-current transition ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />

            <span
              className={`block h-0.5 w-5 bg-current transition ${
                mobileOpen
                  ? "-translate-y-2 -rotate-45"
                  : ""
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-5 py-5 sm:px-6">
            {navigation.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
                    active
                      ? "bg-red-50 text-[#E30613]"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.name}

                  {active && (
                    <span className="h-2 w-2 rounded-full bg-[#E30613]" />
                  )}
                </Link>
              );
            })}

            <div className="pt-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-[#E30613] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#B0000C]"
              >
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}