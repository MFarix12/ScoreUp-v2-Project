import Link from "next/link";

const competitionLinks = [
  { name: "Schedule", href: "/schedule" },
  { name: "Fixtures", href: "/fixtures" },
  { name: "Results", href: "/results" },
  { name: "Bracket", href: "/bracket" },
];

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#111827] text-white">
      {/* Decoration */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-[#E30613]/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 left-20 h-72 w-72 rounded-full bg-[#E30613]/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E30613] text-lg font-black text-white">
                S
              </div>

              <div>
                <p className="text-xl font-black tracking-tight">
                  Score
                  <span className="text-[#E30613]">Up</span>
                </p>

                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                  SuperUPSI Games
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              Follow SuperUPSI Games through one centralized
              platform for competition schedules, fixtures,
              tournament brackets and official results.
            </p>
          </div>

          {/* Competition */}
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-white">
              Competition
            </p>

            <div className="mt-5 space-y-3">
              {competitionLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block w-fit text-sm text-slate-400 transition hover:translate-x-1 hover:text-white"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Staff */}
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-white">
              Staff Access
            </p>

            <p className="mt-5 text-sm leading-6 text-slate-400">
              Administrators and Sports Technicians can sign in
              to manage authorized competition activities.
            </p>

            <Link
              href="/login"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#E30613] transition hover:text-red-400"
            >
              Staff Login
              <span>→</span>
            </Link>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} ScoreUp. SuperUPSI
              Games Competition Management System.
            </p>

            <p>
              Universiti Pendidikan Sultan Idris
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}