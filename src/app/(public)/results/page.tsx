import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  Trophy,
} from "lucide-react";

import { PublicEmptyState } from "@/components/public/public-empty-state";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { PublicSportFilter } from "@/components/public/public-sport-filter";
import { TeamLogo } from "@/components/public/team-logo";
import { createClient } from "@/lib/supabase/server";

interface ResultsPageProps {
  searchParams: Promise<{
    sport?: string;
  }>;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function PublicResultsPage({
  searchParams,
}: ResultsPageProps) {
  const { sport } = await searchParams;
  const supabase = await createClient();

  const { data: results, error } = await supabase
    .from("match_results")
    .select(`
      id,
      home_score,
      away_score,
      winner_participant_id,
      loser_participant_id,
      result_type,
      official_at,
      matches!inner (
        id,
        match_code,
        is_published,
        competitions (
          id,
          name,
          sports (id,name)
        ),
        round:tournament_rounds (id,name),
        home:competition_participants!matches_home_participant_fk (
          id,
          teams (id,name,code,logo_url)
        ),
        away:competition_participants!matches_away_participant_fk (
          id,
          teams (id,name,code,logo_url)
        ),
        match_schedules (
          id,
          scheduled_start,
          is_current,
          is_published,
          venues (id,name)
        )
      )
    `)
    .eq("result_status", "official")
    .eq("is_published", true)
    .eq("matches.is_published", true)
    .order("official_at", { ascending: false });

  if (error) console.error("Public results error:", error);

  const allResults = (results ?? []).map((result: any) => ({
    ...result,
    currentSchedule:
      result.matches?.match_schedules?.find(
        (item: any) => item.is_current && item.is_published
      ) ?? null,
  }));

  const sportsMap = new Map<string, string>();
  allResults.forEach((item: any) => {
    const sports = item.matches?.competitions?.sports;
    if (sports?.id && sports?.name) sportsMap.set(sports.id, sports.name);
  });

  const sports = [...sportsMap.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const visibleResults = sport
    ? allResults.filter(
        (item: any) => item.matches?.competitions?.sports?.id === sport
      )
    : allResults;

  return (
    <>
      <PublicPageHeader
        eyebrow="Results Centre"
        title="Official Results"
        description="See completed SuperUPSI Games matches, final scores, winners and match details across every published sport."
      />

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          <Summary label="Official Results" value={visibleResults.length} icon={<CheckCircle2 className="h-5 w-5" />} />
          <Summary label="Sports" value={sport ? 1 : sports.length} icon={<Trophy className="h-5 w-5" />} />
          <Summary label="Latest Update" value={formatDate(visibleResults[0]?.official_at ?? null)} icon={<CalendarDays className="h-5 w-5" />} text />
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E30613]">Filter Results</p>
              <p className="mt-1 text-sm text-slate-500">Only verified official results are shown publicly.</p>
            </div>
            <PublicSportFilter sports={sports} selectedSport={sport} basePath="/results" />
          </div>
        </div>

        {visibleResults.length === 0 ? (
          <div className="mt-8">
            <PublicEmptyState
              title="No official results found"
              description="Try another sport or check again after results have been validated and published."
              icon="R"
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {visibleResults.map((result: any) => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ResultCard({ result }: { result: any }) {
  const match = result.matches;
  const home = match?.home?.teams;
  const away = match?.away?.teams;
  const homeWon = result.winner_participant_id === match?.home?.id;
  const awayWon = result.winner_participant_id === match?.away?.id;

  return (
    <article className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#E30613]">
            {match?.competitions?.sports?.name ?? "Sport"}
          </p>
          <p className="mt-1 text-sm font-bold text-[#111827]">
            {match?.competitions?.name ?? "Competition"}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Official</span>
      </div>

      <div className="p-5">
        <div className="space-y-3">
          <ResultTeam team={home} score={result.home_score} winner={homeWon} />
          <ResultTeam team={away} score={result.away_score} winner={awayWon} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="font-bold text-[#111827]">{match?.round?.name ?? match?.match_code ?? "Match"}</span>
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[#E30613]" />{formatDate(result.currentSchedule?.scheduled_start ?? result.official_at)}</span>
          {result.currentSchedule?.venues?.name && (
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#E30613]" />{result.currentSchedule.venues.name}</span>
          )}
        </div>
      </div>
    </article>
  );
}

function ResultTeam({ team, score, winner }: { team: any; score: number | null; winner: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-3.5 ${winner ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50"}`}>
      <TeamLogo name={team?.name ?? "TBD"} code={team?.code} logoUrl={team?.logo_url} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate text-sm font-black ${winner ? "text-emerald-800" : "text-[#111827]"}`}>{team?.name ?? "TBD"}</p>
          {winner && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">Winner</span>}
        </div>
        {team?.code && <p className="mt-0.5 text-xs font-bold text-slate-400">{team.code}</p>}
      </div>
      <span className={`text-3xl font-black ${winner ? "text-emerald-700" : "text-[#111827]"}`}>{score ?? "-"}</span>
    </div>
  );
}

function Summary({ label, value, icon, text = false }: { label: string; value: string | number; icon: ReactNode; text?: boolean }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
          <p className={`mt-2 font-black text-[#111827] ${text ? "text-xl" : "text-3xl"}`}>{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-[#E30613]">{icon}</div>
      </div>
    </div>
  );
}
