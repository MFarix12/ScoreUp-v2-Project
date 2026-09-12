import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    editionsResult,
    sportsResult,
    teamsResult,
    competitionsResult,
    matchesResult,
  ] = await Promise.all([
    supabase
      .from("games_editions")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("sports")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("teams")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("competitions")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("matches")
      .select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Games Editions",
      value: editionsResult.count ?? 0,
      symbol: "GE",
    },
    {
      label: "Sports",
      value: sportsResult.count ?? 0,
      symbol: "SP",
    },
    {
      label: "Teams",
      value: teamsResult.count ?? 0,
      symbol: "TM",
    },
    {
      label: "Competitions",
      value: competitionsResult.count ?? 0,
      symbol: "CP",
    },
    {
      label: "Matches",
      value: matchesResult.count ?? 0,
      symbol: "MT",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div>
        <div className="mb-3 h-1 w-12 rounded-full bg-[#E30613]" />

        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Manage SuperUPSI Games through ScoreUp.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="
              group rounded-2xl border border-slate-200
              bg-white p-6 shadow-sm
              transition-all duration-200
              hover:-translate-y-1
              hover:border-red-100
              hover:shadow-md
            "
          >
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-xs font-bold text-[#E30613]">
                {stat.symbol}
              </div>

              <div className="h-2 w-2 rounded-full bg-[#E30613]" />
            </div>

            <p className="text-sm font-medium text-slate-500">
              {stat.label}
            </p>

            <p className="mt-2 text-3xl font-bold text-[#111827]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Competition Overview */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-[#E30613]" />

        <div className="p-6">
          <h2 className="text-lg font-bold text-[#111827]">
            Competition Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            SuperUPSI Games competition management overview.
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-[#F5F6F8] p-8 text-center">
            <p className="font-medium text-slate-600">
              ScoreUp Tournament Management
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Tournament statistics and upcoming matches will appear here.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}