import {
  Award,
  Medal,
  Trophy,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { StaffPageHeader } from "@/components/staff/staff-page-header";
import { StaffPanel } from "@/components/staff/staff-panel";
import { TeamLogo } from "@/components/public/team-logo";

type MedalStanding = {
  games_edition_id: string;
  games_edition_name: string;
  team_id: string;
  team_name: string;
  team_code: string | null;
  team_logo_url: string | null;
  gold: number;
  silver: number;
  bronze: number;
  total_medals: number;
};

type MedalAward = {
  placement_id: string;
  sport_name: string;
  competition_name: string;
  competition_category: string | null;
  team_id: string;
  team_name: string;
  team_code: string | null;
  team_logo_url: string | null;
  position: number;
  medal_type: "gold" | "silver" | "bronze";
};

function sortStandings(rows: MedalStanding[]) {
  return [...rows].sort(
    (a, b) =>
      b.gold - a.gold ||
      b.silver - a.silver ||
      b.bronze - a.bronze ||
      b.total_medals - a.total_medals ||
      a.team_name.localeCompare(b.team_name)
  );
}

export default async function AdminMedalsPage() {
  await requireAdmin();

  const supabase = await createClient();

  const { data: activeEdition } = await supabase
    .from("games_editions")
    .select("id,name,year")
    .eq("is_active", true)
    .maybeSingle();

  const editionId = activeEdition?.id ?? null;

  const standingsQuery = supabase
    .from("medal_standings")
    .select(`
      games_edition_id,
      games_edition_name,
      team_id,
      team_name,
      team_code,
      team_logo_url,
      gold,
      silver,
      bronze,
      total_medals
    `);

  const awardsQuery = supabase
    .from("medal_award_details")
    .select(`
      placement_id,
      games_edition_id,
      sport_name,
      competition_name,
      competition_category,
      team_id,
      team_name,
      team_code,
      team_logo_url,
      position,
      medal_type
    `)
    .order("position", { ascending: true });

  if (editionId) {
    standingsQuery.eq("games_edition_id", editionId);
    awardsQuery.eq("games_edition_id", editionId);
  }

  const [standingsResult, awardsResult] = await Promise.all([
    standingsQuery,
    awardsQuery,
  ]);

  if (standingsResult.error) {
    throw new Error(
      `Unable to load medal standings: ${standingsResult.error.message}`
    );
  }

  if (awardsResult.error) {
    throw new Error(
      `Unable to load medal awards: ${awardsResult.error.message}`
    );
  }

  const standings = sortStandings(
    (standingsResult.data ?? []) as MedalStanding[]
  );

  const awards = (awardsResult.data ?? []) as MedalAward[];

  const goldCount = standings.reduce(
    (sum, row) => sum + row.gold,
    0
  );
  const silverCount = standings.reduce(
    (sum, row) => sum + row.silver,
    0
  );
  const bronzeCount = standings.reduce(
    (sum, row) => sum + row.bronze,
    0
  );

  return (
    <div className="space-y-6">
      <StaffPageHeader
        eyebrow="Competition Outcomes"
        title="Medal Table"
        description="Medals are calculated automatically from completed medal-event competition placements. No manual medal totals are maintained."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Gold" value={goldCount} tone="gold" />
        <Metric label="Silver" value={silverCount} tone="silver" />
        <Metric label="Bronze" value={bronzeCount} tone="bronze" />
        <Metric
          label="Total Medals"
          value={goldCount + silverCount + bronzeCount}
          tone="total"
        />
      </div>

      <StaffPanel
        title="Overall Medal Standings"
        description={
          activeEdition
            ? `${activeEdition.name} medal ranking across all completed medal events.`
            : "Medal ranking across completed medal events."
        }
      >
        {standings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-4 py-3 text-center">Gold</th>
                  <th className="px-4 py-3 text-center">Silver</th>
                  <th className="px-4 py-3 text-center">Bronze</th>
                  <th className="px-4 py-3 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {standings.map((row, index) => (
                  <tr
                    key={row.team_id}
                    className={index < 3 ? "bg-amber-50/30" : "hover:bg-slate-50"}
                  >
                    <td className="px-4 py-4">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-[#111827]">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <TeamLogo
                          name={row.team_name}
                          code={row.team_code}
                          logoUrl={row.team_logo_url}
                          size="sm"
                        />
                        <div>
                          <p className="font-black text-[#111827]">
                            {row.team_name}
                          </p>
                          {row.team_code && (
                            <p className="text-xs font-semibold text-slate-400">
                              {row.team_code}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-black text-amber-600">
                      {row.gold}
                    </td>
                    <td className="px-4 py-4 text-center font-black text-slate-500">
                      {row.silver}
                    </td>
                    <td className="px-4 py-4 text-center font-black text-orange-600">
                      {row.bronze}
                    </td>
                    <td className="px-4 py-4 text-center text-lg font-black text-[#111827]">
                      {row.total_medals}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs leading-5 text-slate-500">
          Ranking currently uses Gold → Silver → Bronze → Total. Replace this comparator if the official SuperUPSI medal tie-break rule differs.
        </div>
      </StaffPanel>

      <StaffPanel
        title="Medal Awards"
        description="Audit view of the competition placements currently contributing to the medal table."
      >
        {awards.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No medal-awarding placements are available yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {awards.map((award) => (
              <div
                key={award.placement_id}
                className="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <TeamLogo
                    name={award.team_name}
                    code={award.team_code}
                    logoUrl={award.team_logo_url}
                    size="sm"
                  />
                  <div>
                    <p className="font-black text-[#111827]">
                      {award.team_name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {award.sport_name} · {award.competition_name}
                      {award.competition_category
                        ? ` · ${award.competition_category}`
                        : ""}
                    </p>
                  </div>
                </div>

                <MedalBadge medal={award.medal_type} />
              </div>
            ))}
          </div>
        )}
      </StaffPanel>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "gold" | "silver" | "bronze" | "total";
}) {
  const styles = {
    gold: "bg-amber-50 text-amber-600",
    silver: "bg-slate-100 text-slate-500",
    bronze: "bg-orange-50 text-orange-600",
    total: "bg-red-50 text-[#E30613]",
  }[tone];

  const Icon = tone === "total" ? Trophy : Medal;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-[#111827]">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${styles}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function MedalBadge({
  medal,
}: {
  medal: "gold" | "silver" | "bronze";
}) {
  const config = {
    gold: {
      label: "Gold",
      className: "bg-amber-50 text-amber-700",
    },
    silver: {
      label: "Silver",
      className: "bg-slate-100 text-slate-600",
    },
    bronze: {
      label: "Bronze",
      className: "bg-orange-50 text-orange-700",
    },
  }[medal];

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${config.className}`}
    >
      <Award className="h-4 w-4" />
      {config.label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#E30613]">
        <Trophy className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-black text-[#111827]">No medals awarded yet</h3>
      <p className="mt-2 text-sm text-slate-500">
        Complete a competition marked as a medal event to populate the medal table.
      </p>
    </div>
  );
}
