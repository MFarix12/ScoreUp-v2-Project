import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireTechnician } from "@/lib/auth/require-technician";
import { StaffPageHeader } from "@/components/staff/staff-page-header";
import { StaffPanel } from "@/components/staff/staff-panel";
import { StaffStatusBadge } from "@/components/staff/staff-status-badge";

export default async function TechnicianResultsPage() {
  const profile = await requireTechnician();
  const supabase = await createClient();

  const { data: results, error } = await supabase
    .from("match_results")
    .select(`
      id,
      match_id,
      home_score,
      away_score,
      result_status,
      result_type,
      submitted_at,
      official_at,
      notes,
      matches (
        id,
        match_code,
        competitions (
          id,
          name,
          sports (
            id,
            name
          )
        ),
        tournament_rounds (
          id,
          name
        ),
        home:competition_participants!matches_home_participant_fk (
          id,
          teams (
            id,
            name,
            code
          )
        ),
        away:competition_participants!matches_away_participant_fk (
          id,
          teams (
            id,
            name,
            code
          )
        )
      )
    `)
    .eq("submitted_by", profile.id)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = results ?? [];

  return (
    <div className="space-y-6">
      <StaffPageHeader
        eyebrow="Sports Technician"
        title="Result History"
        description="Track every result you have submitted and its current validation status."
        action={
          <Link
            href="/technician/matches"
            className="inline-flex items-center justify-center rounded-xl bg-[#E30613] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B0000C]"
          >
            View Matches
          </Link>
        }
      />

      <StaffPanel
        title="My Submitted Results"
        description={`${rows.length} result${rows.length === 1 ? "" : "s"} submitted from your account.`}
      >
        {rows.length > 0 ? (
          <div className="space-y-4">
            {rows.map((result: any) => {
              const match = result.matches;
              const homeName = match?.home?.teams?.name ?? "TBD";
              const awayName = match?.away?.teams?.name ?? "TBD";

              return (
                <article
                  key={result.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.15em] text-[#E30613]">
                        {match?.match_code ?? "MATCH"}
                      </p>
                      <h2 className="mt-1 font-black text-[#111827]">
                        {match?.competitions?.name ?? "Competition"}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {match?.competitions?.sports?.name ?? "Sport"}
                        {" · "}
                        {match?.tournament_rounds?.name ?? "Match"}
                      </p>
                    </div>

                    <StaffStatusBadge status={result.result_status} />
                  </div>

                  <div className="grid gap-0 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Home</p>
                      <p className="mt-2 font-black text-[#111827]">{homeName}</p>
                      <p className="mt-3 text-3xl font-black text-[#111827]">{result.home_score ?? "-"}</p>
                    </div>
                    <div className="hidden px-4 text-sm font-black text-slate-300 sm:block">VS</div>
                    <div className="border-t border-slate-100 p-5 sm:border-l sm:border-t-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Away</p>
                      <p className="mt-2 font-black text-[#111827]">{awayName}</p>
                      <p className="mt-3 text-3xl font-black text-[#111827]">{result.away_score ?? "-"}</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
                    <span>
                      Submitted {result.submitted_at ? new Date(result.submitted_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" }) : "-"}
                    </span>
                    {result.official_at && (
                      <span>
                        Official {new Date(result.official_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <h2 className="font-black text-[#111827]">No submitted results yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Results you submit from assigned matches will appear here.
            </p>
          </div>
        )}
      </StaffPanel>
    </div>
  );
}
