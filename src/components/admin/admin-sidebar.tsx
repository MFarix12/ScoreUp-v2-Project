import Link from "next/link";

const navigation = [
  { name: "Dashboard", href: "/admin" },
  { name: "Games Editions", href: "/admin/editions" },
  { name: "Sports", href: "/admin/sports" },
  { name: "Teams", href: "/admin/teams" },
  { name: "Venues", href: "/admin/venues" },
  { name: "Competitions", href: "/admin/competitions" },
  { name: "Participants", href: "/admin/participants" },
  { name: "Tournament", href: "/admin/tournaments" },
  { name: "Matches", href: "/admin/matches" },
  { name: "Results", href: "/admin/results" },
  { name: "Users", href: "/admin/users" },
];

export function AdminSidebar() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 bg-[#111827] text-white lg:block">
      {/* Brand */}
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E30613] font-black text-white">
            S
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Score<span className="text-[#E30613]">Up</span>
            </h1>

            <p className="text-xs text-slate-400">
              SuperUPSI Games
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1.5 p-4">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="
              block rounded-xl px-4 py-3
              text-sm font-medium text-slate-300
              transition-all duration-200
              hover:bg-[#E30613]
              hover:text-white
            "
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="mx-4 mt-8 border-t border-white/10 pt-5">
        <p className="px-4 text-xs leading-5 text-slate-500">
          Sports Competition
          <br />
          Management System
        </p>
      </div>
    </aside>
  );
}