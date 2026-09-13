import Link from "next/link";

const navigation = [
  {
    name: "Dashboard",
    href: "/technician",
  },
  {
    name: "Matches",
    href: "/technician/matches",
  },
];

export function TechnicianSidebar() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 bg-[#111827] text-white lg:block">
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E30613] font-black">
            S
          </div>

          <div>
            <h1 className="text-xl font-bold">
              Score
              <span className="text-[#E30613]">
                Up
              </span>
            </h1>

            <p className="text-xs text-slate-400">
              Sports Technician
            </p>
          </div>
        </div>
      </div>

      <nav className="space-y-1.5 p-4">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-[#E30613] hover:text-white"
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}