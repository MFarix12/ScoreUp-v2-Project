import {
  Medal,
  Trophy,
} from "lucide-react";

import { PublicEmptyState } from "@/components/public/public-empty-state";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { TeamLogo } from "@/components/public/team-logo";
import { createClient } from "@/lib/supabase/server";

type MedalRow = {
  teamId: string;
  name: string;
  code: string | null;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
};

function rankRows(placements: any[]): MedalRow[] {
  const teams = new Map<string, MedalRow>();

  for (const placement of placements) {
    const team = placement.competition_participants?.teams;
    if (!team) continue;

    const current = teams.get(team.id) ?? {
      teamId: team.id,
      name: team.name,
      code: team.code ?? null,
      gold: 0,
      silver: 0,
      bronze: 0,
      total: 0,
    };

    if (placement.position === 1) current.gold += 1;
    if (placement.position === 2) current.silver += 1;
    if (placement.position === 3) current.bronze += 1;
    if ([1, 2, 3].includes(placement.position)) current.total += 1;

    teams.set(team.id, current);
  }

  return [...teams.values()].sort(
    (a, b) =>
      b.gold - a.gold ||
      b.silver - a.silver ||
      b.bronze - a.bronze ||
      b.total - a.total ||
      a.name.localeCompare(b.name)
  );
}

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: placements, error } = await supabase
    .from("competition_placements")
    .select(`
      id,
      position,
      competition_participants!inner (
        id,
        teams!inner (id,name,code)
      ),
      competitions!inner (
        id,
        status,
        sports!inner (
          id,
          name,
          games_editions!inner (id,name,is_public)
        )
      )
    `)
    .eq("competitions.sports.games_editions.is_public", true)
    .in("position", [1, 2, 3]);

  if (error) console.error("Public leaderboard error:", error);

  const rows = rankRows(placements ?? []);
  const topThree = rows.slice(0, 3);
  const totalMedals = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <>
      <PublicPageHeader
        eyebrow="Overall Medal Table"
        title="Leaderboard"
        description="Compare team medal performance across all completed and published SuperUPSI Games competitions."
      />

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        {rows.length === 0 ? (
          <PublicEmptyState
            title="No medals awarded yet"
            description="The overall medal table will appear after competitions produce official first, second and third-place finishes."
            icon="M"
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Teams on Medal Table" value={rows.length} />
              <Stat label="Total Medals Awarded" value={totalMedals} />
              <Stat label="Gold Medals Awarded" value={rows.reduce((sum, row) => sum + row.gold, 0)} />
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {topThree.map((row, index) => (
                <PodiumCard key={row.teamId} row={row} rank={index + 1} />
              ))}
            </div>

            <div className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E30613]">All Teams</p>
                  <h2 className="mt-1 text-xl font-black text-[#111827]">Overall Medal Standings</h2>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-[#E30613]">
                  <Medal className="h-4 w-4" /> {totalMedals} medals
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-4 text-left">Rank</th>
                      <th className="px-5 py-4 text-left">Team</th>
                      <th className="px-4 py-4 text-center">Gold</th>
                      <th className="px-4 py-4 text-center">Silver</th>
                      <th className="px-4 py-4 text-center">Bronze</th>
                      <th className="px-5 py-4 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, index) => (
                      <tr key={row.teamId} className={index < 3 ? "bg-amber-50/30" : "hover:bg-slate-50"}>
                        <td className="px-5 py-4">
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${index === 0 ? "bg-amber-400 text-amber-950" : index === 1 ? "bg-slate-300 text-slate-700" : index === 2 ? "bg-orange-200 text-orange-800" : "bg-slate-100 text-slate-500"}`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <TeamLogo name={row.name} code={row.code} size="sm" />
                            <div>
                              <p className="font-black text-[#111827]">{row.name}</p>
                              {row.code && <p className="text-xs font-bold text-slate-400">{row.code}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center"><MedalValue value={row.gold} tone="gold" /></td>
                        <td className="px-4 py-4 text-center"><MedalValue value={row.silver} tone="silver" /></td>
                        <td className="px-4 py-4 text-center"><MedalValue value={row.bronze} tone="bronze" /></td>
                        <td className="px-5 py-4 text-center text-lg font-black text-[#111827]">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs leading-5 text-slate-500 sm:px-6">
                Medal counts are derived from official competition placements. The current display orders teams by Gold, then Silver, then Bronze; update the comparator when the official SuperUPSI medal tie-break rule is confirmed.
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}

function PodiumCard({ row, rank }: { row: MedalRow; rank: number }) {
  const styles = {
    1: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
    2: "border-slate-200 bg-gradient-to-br from-slate-100 to-white",
    3: "border-orange-200 bg-gradient-to-br from-orange-50 to-white",
  }[rank];

  return (
    <div className={`relative overflow-hidden rounded-[26px] border p-5 shadow-sm ${styles}`}>
      <div className="absolute right-4 top-4 text-5xl font-black text-slate-900/[0.05]">#{rank}</div>
      <div className="flex items-center gap-4">
        <TeamLogo name={row.name} code={row.code} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Trophy className={`h-4 w-4 ${rank === 1 ? "text-amber-500" : "text-slate-400"}`} />
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Rank {rank}</p>
          </div>
          <h3 className="mt-1 truncate text-lg font-black text-[#111827]">{row.name}</h3>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2 text-center">
        <Mini label="G" value={row.gold} />
        <Mini label="S" value={row.silver} />
        <Mini label="B" value={row.bronze} />
        <Mini label="Total" value={row.total} />
      </div>
    </div>
  );
}

function MedalValue({ value, tone }: { value: number; tone: "gold" | "silver" | "bronze" }) {
  const style = tone === "gold" ? "bg-amber-50 text-amber-700" : tone === "silver" ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-700";
  return <span className={`inline-flex min-w-9 justify-center rounded-full px-2.5 py-1 font-black ${style}`}>{value}</span>;
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/80 p-2.5">
      <p className="text-lg font-black text-[#111827]">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#111827]">{value}</p>
    </div>
  );
}
