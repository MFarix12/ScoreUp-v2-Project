import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Medal,
  Trophy,
} from "lucide-react";

import { TeamLogo } from "@/components/public/team-logo";
import { createClient } from "@/lib/supabase/server";

type MedalRow = {
  teamId: string;
  name: string;
  code: string | null;
  gold: number;
  silver: number;
  bronze: number;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function buildMedalRows(placements: any[]): MedalRow[] {
  const table = new Map<string, MedalRow>();

  for (const placement of placements) {
    const team = placement.competition_participants?.teams;
    if (!team) continue;

    const current = table.get(team.id) ?? {
      teamId: team.id,
      name: team.name,
      code: team.code ?? null,
      gold: 0,
      silver: 0,
      bronze: 0,
    };

    if (placement.position === 1) current.gold += 1;
    if (placement.position === 2) current.silver += 1;
    if (placement.position === 3) current.bronze += 1;

    table.set(team.id, current);
  }

  return [...table.values()]
    .sort((a, b) =>
      b.gold - a.gold ||
      b.silver - a.silver ||
      b.bronze - a.bronze ||
      a.name.localeCompare(b.name)
    )
    .slice(0, 3);
}

export default async function PublicHomePage() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [editionResult, schedulesResult, resultsResult, placementsResult] =
    await Promise.all([
      supabase
        .from("games_editions")
        .select("id,name,year,start_date,end_date")
        .eq("is_public", true)
        .eq("is_active", true)
        .maybeSingle(),

      supabase
        .from("match_schedules")
        .select(`
          id,
          scheduled_start,
          schedule_status,
          venues (name),
          matches!inner (
            id,
            match_code,
            is_published,
            competitions (
              name,
              sports (id,name)
            ),
            round:tournament_rounds (name),
            home:competition_participants!matches_home_participant_fk (
              teams (id,name,code)
            ),
            away:competition_participants!matches_away_participant_fk (
              teams (id,name,code)
            )
          )
        `)
        .eq("is_current", true)
        .eq("is_published", true)
        .eq("matches.is_published", true)
        .in("schedule_status", ["confirmed", "postponed"])
        .gte("scheduled_start", now)
        .order("scheduled_start", { ascending: true })
        .limit(4),

      supabase
        .from("match_results")
        .select(`
          id,
          home_score,
          away_score,
          winner_participant_id,
          official_at,
          matches!inner (
            id,
            match_code,
            is_published,
            competitions (
              name,
              sports (id,name)
            ),
            round:tournament_rounds (name),
            home:competition_participants!matches_home_participant_fk (
              id,
              teams (id,name,code)
            ),
            away:competition_participants!matches_away_participant_fk (
              id,
              teams (id,name,code)
            )
          )
        `)
        .eq("result_status", "official")
        .eq("is_published", true)
        .eq("matches.is_published", true)
        .order("official_at", { ascending: false })
        .limit(4),

      supabase
        .from("competition_placements")
        .select(`
          position,
          competition_participants!inner (
            id,
            teams!inner (id,name,code)
          ),
          competitions!inner (
            id,
            sports!inner (
              id,
              games_editions!inner (id,is_public)
            )
          )
        `)
        .eq("competitions.sports.games_editions.is_public", true),
    ]);

  const edition = editionResult.data;
  const upcoming = schedulesResult.data ?? [];
  const recentResults = resultsResult.data ?? [];
  const medalLeaders = buildMedalRows(placementsResult.data ?? []);

  return (
    <>
      <section className="relative overflow-hidden bg-[#111827] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-[440px] w-[440px] rounded-full bg-[#E30613]/25 blur-3xl" />
          <div className="absolute -bottom-40 left-[8%] h-80 w-80 rounded-full bg-red-900/30 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.35) 1px,transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-red-300">
              <span className="h-2 w-2 rounded-full bg-[#E30613]" />
              Live Competition Centre
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Follow every moment of the <span className="text-[#E30613]">SuperUPSI Games.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              {edition?.name ?? "SuperUPSI Games"} schedules, official results,
              standings and medal rankings in one fast, public-friendly platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/schedule"
                className="inline-flex items-center gap-2 rounded-xl bg-[#E30613] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 hover:bg-[#B0000C]"
              >
                View Schedule <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-black text-white transition hover:bg-white/10"
              >
                Medal Leaderboard <Trophy className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Next Up</p>
                <h2 className="mt-1 text-xl font-black">Upcoming Matches</h2>
              </div>
              <CalendarDays className="h-6 w-6 text-[#E30613]" />
            </div>

            <div className="mt-5 space-y-3">
              {upcoming.length > 0 ? (
                upcoming.slice(0, 3).map((schedule: any) => {
                  const match = schedule.matches;
                  const home = match?.home?.teams;
                  const away = match?.away?.teams;
                  return (
                    <div key={schedule.id} className="rounded-2xl border border-white/10 bg-[#0B1220]/50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold text-red-300">
                          {match?.competitions?.sports?.name ?? "Sport"}
                        </p>
                        <p className="text-xs text-slate-400">{formatDateTime(schedule.scheduled_start)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <TeamLogo name={home?.name ?? "TBD"} code={home?.code} size="sm" />
                          <span className="truncate text-sm font-bold">{home?.name ?? "TBD"}</span>
                        </div>
                        <span className="text-xs font-black text-slate-500">VS</span>
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-right text-sm font-bold">{away?.name ?? "TBD"}</span>
                          <TeamLogo name={away?.name ?? "TBD"} code={away?.code} size="sm" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
                  No upcoming published matches yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E30613]">Latest Action</p>
                <h2 className="mt-2 text-2xl font-black text-[#111827]">Recent Results</h2>
              </div>
              <Link href="/results" className="flex items-center gap-1 text-sm font-bold text-[#E30613]">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {recentResults.length > 0 ? recentResults.map((result: any) => {
                const match = result.matches;
                const home = match?.home?.teams;
                const away = match?.away?.teams;
                const homeWon = result.winner_participant_id === match?.home?.id;
                const awayWon = result.winner_participant_id === match?.away?.id;

                return (
                  <div key={result.id} className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-black uppercase tracking-wide text-[#E30613]">{match?.competitions?.sports?.name ?? "Sport"}</span>
                      <span className="text-slate-400">{match?.round?.name ?? match?.match_code ?? "Match"}</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      <ScoreTeam team={home} score={result.home_score} winner={homeWon} />
                      <ScoreTeam team={away} score={result.away_score} winner={awayWon} />
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-slate-500">No published results yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] bg-[#111827] p-6 text-white shadow-sm sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Medal Watch</p>
                <h2 className="mt-2 text-2xl font-black">Top Teams</h2>
              </div>
              <Medal className="h-6 w-6 text-[#E30613]" />
            </div>

            <div className="mt-6 space-y-3">
              {medalLeaders.length > 0 ? medalLeaders.map((row, index) => (
                <div key={row.teamId} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <span className="w-6 text-center text-sm font-black text-slate-400">{index + 1}</span>
                  <TeamLogo name={row.name} code={row.code} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{row.name}</p>
                    <p className="text-xs text-slate-400">{row.gold + row.silver + row.bronze} medals</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-amber-300">{row.gold}</p>
                    <p className="text-[10px] uppercase text-slate-500">Gold</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400">Medal standings will appear after competitions are completed.</p>
              )}
            </div>

            <Link href="/leaderboard" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#E30613] px-4 py-3 text-sm font-black hover:bg-[#B0000C]">
              Open Leaderboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink title="Upcoming Matches" text="See what is happening next." href="/schedule" icon={<CalendarDays className="h-5 w-5" />} />
          <QuickLink title="Official Results" text="Find out who won." href="/results" icon={<CheckIcon />} />
          <QuickLink title="Standings" text="See who leads each sport." href="/standings" icon={<BarsIcon />} />
          <QuickLink title="Leaderboard" text="Compare overall medals." href="/leaderboard" icon={<Trophy className="h-5 w-5" />} />
        </div>
      </section>
    </>
  );
}

function ScoreTeam({ team, score, winner }: { team: any; score: number | null; winner: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl p-2 ${winner ? "bg-emerald-50" : "bg-slate-50"}`}>
      <TeamLogo name={team?.name ?? "TBD"} code={team?.code} size="sm" />
      <p className={`min-w-0 flex-1 truncate text-sm font-bold ${winner ? "text-emerald-800" : "text-[#111827]"}`}>{team?.name ?? "TBD"}</p>
      <span className={`text-xl font-black ${winner ? "text-emerald-700" : "text-[#111827]"}`}>{score ?? "-"}</span>
    </div>
  );
}

function QuickLink({ title, text, href, icon }: { title: string; text: string; href: string; icon: ReactNode }) {
  return (
    <Link href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#E30613]">{icon}</div>
      <h3 className="mt-4 font-black text-[#111827] group-hover:text-[#E30613]">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </Link>
  );
}

function CheckIcon() {
  return <span className="text-lg font-black">✓</span>;
}

function BarsIcon() {
  return <span className="text-lg font-black">≡</span>;
}
