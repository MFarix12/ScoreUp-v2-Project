import Link from "next/link";
import { Trophy } from "lucide-react";

const links = [
  { name: "Home", href: "/" },
  { name: "Schedule", href: "/schedule" },
  { name: "Results", href: "/results" },
  { name: "Standings", href: "/standings" },
  { name: "Leaderboard", href: "/leaderboard" },
];

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#111827] text-white">
      <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-[#E30613]/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E30613]">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-black">Score<span className="text-[#E30613]">Up</span></p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">SuperUPSI Games</p>
              </div>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              Follow upcoming matches, official results, competition standings and the overall SuperUPSI medal table in one place.
            </p>
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em]">Explore</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {links.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm text-slate-400 transition hover:text-white">
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em]">Staff Access</p>
            <p className="mt-5 text-sm leading-6 text-slate-400">
              Authorized Administrators and Sports Technicians can sign in to manage competition activities.
            </p>
            <Link href="/login" className="mt-5 inline-flex font-bold text-[#E30613] hover:text-red-400">
              Staff Login →
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} ScoreUp. SuperUPSI Games Competition Management System.</p>
          <p>Universiti Pendidikan Sultan Idris</p>
        </div>
      </div>
    </footer>
  );
}
