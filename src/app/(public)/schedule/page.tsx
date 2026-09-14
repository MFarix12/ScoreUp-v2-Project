import type { ReactNode } from "react";
import {
  CalendarDays,
  Clock3,
  MapPin,
} from "lucide-react";

import { PublicEmptyState } from "@/components/public/public-empty-state";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { PublicSportFilter } from "@/components/public/public-sport-filter";
import { TeamLogo } from "@/components/public/team-logo";
import { createClient } from "@/lib/supabase/server";

interface SchedulePageProps {
  searchParams: Promise<{
    sport?: string;
  }>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function dateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export default async function PublicSchedulePage({
  searchParams,
}: SchedulePageProps) {
  const { sport } = await searchParams;
  const supabase = await createClient();

  const { data: schedules, error } = await supabase
    .from("match_schedules")
    .select(`
      id,
      scheduled_start,
      scheduled_end,
      schedule_status,
      venues (id,name,code),
      matches!inner (
        id,
        match_code,
        status,
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
        )
      )
    `)
    .eq("is_current", true)
    .eq("is_published", true)
    .eq("matches.is_published", true)
    .in("schedule_status", ["confirmed", "postponed"])
    .gte("scheduled_start", new Date().toISOString())
    .order("scheduled_start", { ascending: true });

  if (error) console.error("Public schedule error:", error);

  const allSchedules = schedules ?? [];

  const sportsMap = new Map<string, string>();
  allSchedules.forEach((item: any) => {
    const sports = item.matches?.competitions?.sports;
    if (sports?.id && sports?.name) sportsMap.set(sports.id, sports.name);
  });

  const sports = [...sportsMap.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const visibleSchedules = sport
    ? allSchedules.filter(
        (item: any) => item.matches?.competitions?.sports?.id === sport
      )
    : allSchedules;

  const groups = new Map<string, any[]>();
  visibleSchedules.forEach((item: any) => {
    const key = dateKey(item.scheduled_start);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });

  return (
    <>
      <PublicPageHeader
        eyebrow="Match Centre"
        title="Schedule"
        description="See all upcoming SuperUPSI Games matches with teams, sport, round, time and venue information."
      />

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E30613]">Filter Schedule</p>
              <p className="mt-1 text-sm text-slate-500">
                {visibleSchedules.length} upcoming {visibleSchedules.length === 1 ? "match" : "matches"}
              </p>
            </div>
            <PublicSportFilter sports={sports} selectedSport={sport} basePath="/schedule" />
          </div>
        </div>

        {visibleSchedules.length === 0 ? (
          <div className="mt-8">
            <PublicEmptyState
              title="No upcoming matches found"
              description="Try another sport or check again after the competition schedule has been published."
              icon="S"
            />
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {[...groups.entries()].map(([key, items]) => (
              <section key={key}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111827] text-white">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#111827]">{formatDate(items[0].scheduled_start)}</h2>
                    <p className="text-sm text-slate-500">{items.length} {items.length === 1 ? "match" : "matches"}</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {items.map((schedule: any) => (
                    <ScheduleCard key={schedule.id} schedule={schedule} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ScheduleCard({ schedule }: { schedule: any }) {
  const match = schedule.matches;
  const home = match?.home?.teams;
  const away = match?.away?.teams;
  const postponed = schedule.schedule_status === "postponed";

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
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${postponed ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
          {postponed ? "Postponed" : "Scheduled"}
        </span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamBlock team={home} align="left" />
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-400">VS</div>
          <TeamBlock team={away} align="right" />
        </div>

        <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <Info icon={<Clock3 className="h-4 w-4" />} label="Time" value={formatTime(schedule.scheduled_start)} />
          <Info icon={<MapPin className="h-4 w-4" />} label="Venue" value={schedule.venues?.name ?? "TBA"} />
          <Info icon={<CalendarDays className="h-4 w-4" />} label="Round" value={match?.round?.name ?? match?.match_code ?? "Match"} />
        </div>
      </div>
    </article>
  );
}

function TeamBlock({ team, align }: { team: any; align: "left" | "right" }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <TeamLogo name={team?.name ?? "TBD"} code={team?.code} logoUrl={team?.logo_url} />
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-[#111827]">{team?.name ?? "TBD"}</p>
        {team?.code && <p className="mt-0.5 text-xs font-bold text-slate-400">{team.code}</p>}
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-[#E30613]">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-xs font-bold text-slate-700">{value}</p>
      </div>
    </div>
  );
}
