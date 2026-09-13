import Link from "next/link";

import { PublicEmptyState } from "@/components/public/public-empty-state";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { createClient } from "@/lib/supabase/server";

export default async function PublicResultsPage() {
  const supabase = await createClient();

  const { data: results, error } = await supabase
    .from("match_results")
    .select(`
      id,
      home_score,
      away_score,
      result_status,
      result_type,
      official_at,
      is_published,

      matches (
        id,
        match_code,
        status,
        is_published,

        competitions (
          id,
          name,

          sports (
            id,
            name
          )
        ),

        round:tournament_rounds (
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
        ),

        match_schedules (
          id,
          scheduled_start,
          is_current,
          is_published,

          venues (
            id,
            name,
            code
          )
        )
      )
    `)
    .eq("result_status", "official")
    .eq("is_published", true)
    .order("official_at", {
      ascending: false,
    });

  if (error) {
    console.error("Public results error:", error);
  }

  const visibleResults =
    (results ?? [])
      .filter(
        (result) =>
          result.matches?.is_published === true
      )
      .map((result) => {
        const currentSchedule =
          result.matches?.match_schedules?.find(
            (schedule: any) =>
              schedule.is_current === true &&
              schedule.is_published === true
          ) ?? null;

        return {
          ...result,
          currentSchedule,
        };
      });

  const groupedResults =
    groupResultsBySport(visibleResults);

  return (
    <>
      <PublicPageHeader
        eyebrow="SuperUPSI Games"
        title="Official Results"
        description="View verified and published match results across all SuperUPSI Games competitions."
      />

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ResultSummaryCard
            label="Official Results"
            value={visibleResults.length}
            description="Published and verified"
          />

          <ResultSummaryCard
            label="Sports"
            value={Object.keys(groupedResults).length}
            description="Sports with published results"
          />

          <ResultSummaryCard
            label="Latest Update"
            value={
              visibleResults[0]?.official_at
                ? formatShortDate(
                    visibleResults[0].official_at
                  )
                : "—"
            }
            description="Most recent official result"
            textValue
          />
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E30613]">
              Results Centre
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Only official and published results are shown publicly.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/schedule"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#111827] transition hover:border-red-200 hover:bg-red-50 hover:text-[#E30613]"
            >
              Schedule
            </Link>

            <Link
              href="/fixtures"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#111827] transition hover:border-red-200 hover:bg-red-50 hover:text-[#E30613]"
            >
              Fixtures
            </Link>

            <Link
              href="/bracket"
              className="rounded-xl bg-[#E30613] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B0000C]"
            >
              Bracket
            </Link>
          </div>
        </div>

        {visibleResults.length === 0 ? (
          <div className="mt-8">
            <PublicEmptyState
              title="No official results yet"
              description="Verified competition results will appear here after they have been validated and published by the administrator."
              icon="R"
            />
          </div>
        ) : (
          <div className="mt-12 space-y-14">
            {Object.entries(groupedResults).map(
              ([sportName, sportResults]) => (
                <section key={sportName}>
                  <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                      <div className="mb-3 h-1 w-10 rounded-full bg-[#E30613]" />

                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E30613]">
                        Sport
                      </p>

                      <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                        {sportName}
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        {sportResults.length} published{" "}
                        {sportResults.length === 1
                          ? "result"
                          : "results"}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                      {sportResults.length}{" "}
                      {sportResults.length === 1
                        ? "match"
                        : "matches"}
                    </span>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    {sportResults.map((result) => (
                      <ResultCard
                        key={result.id}
                        result={result}
                      />
                    ))}
                  </div>
                </section>
              )
            )}
          </div>
        )}
      </section>
    </>
  );
}

function ResultSummaryCard({
  label,
  value,
  description,
  textValue = false,
}: {
  label: string;
  value: number | string;
  description: string;
  textValue?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-3 font-black tracking-tight text-[#111827] ${
          textValue
            ? "text-xl"
            : "text-3xl"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ResultCard({
  result,
}: {
  result: any;
}) {
  const match = result.matches;

  const homeName =
    match?.home?.teams?.name ?? "TBD";

  const awayName =
    match?.away?.teams?.name ?? "TBD";

  const homeCode =
    match?.home?.teams?.code ?? "";

  const awayCode =
    match?.away?.teams?.code ?? "";

  const homeWon =
    result.home_score >
    result.away_score;

  const awayWon =
    result.away_score >
    result.home_score;

  const isDraw =
    result.home_score ===
    result.away_score;

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      {/* Top */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#E30613]">
              {match?.match_code ?? "Match"}
            </span>

            {match?.round?.name && (
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                {match.round.name}
              </span>
            )}
          </div>

          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            {match?.competitions?.name ??
              "Competition"}
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Official
        </span>
      </div>

      {/* Score */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-7 sm:gap-6 sm:px-6">
        <ResultTeam
          name={homeName}
          code={homeCode}
          score={result.home_score}
          winner={homeWon}
        />

        <div className="text-center">
          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-[#111827] px-3 text-[10px] font-black text-white">
            {isDraw ? "DRAW" : "FT"}
          </span>
        </div>

        <ResultTeam
          name={awayName}
          code={awayCode}
          score={result.away_score}
          winner={awayWon}
          align="right"
        />
      </div>

      {/* Winner */}
      {!isDraw && (
        <div className="mx-5 mb-5 rounded-2xl bg-red-50 px-4 py-3 sm:mx-6">
          <p className="text-xs font-semibold text-slate-500">
            Winner
          </p>

          <p className="mt-1 text-sm font-black text-[#E30613]">
            {homeWon
              ? homeName
              : awayName}
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="grid gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:grid-cols-3 sm:px-6">
        <ResultMeta
          label="Sport"
          value={
            match?.competitions?.sports?.name ??
            "—"
          }
        />

        <ResultMeta
          label="Venue"
          value={
            result.currentSchedule?.venues?.name ??
            "—"
          }
        />

        <ResultMeta
          label="Official"
          value={
            result.official_at
              ? formatDateTime(
                  result.official_at
                )
              : "—"
          }
          align="right"
        />
      </div>
    </article>
  );
}

function ResultTeam({
  name,
  code,
  score,
  winner,
  align = "left",
}: {
  name: string;
  code?: string;
  score: number;
  winner: boolean;
  align?: "left" | "right";
}) {
  return (
    <div
      className={
        align === "right"
          ? "text-right"
          : "text-left"
      }
    >
      {winner && (
        <span className="mb-2 inline-flex rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#E30613]">
          Winner
        </span>
      )}

      <p
        className={`text-sm font-black sm:text-base ${
          winner
            ? "text-[#111827]"
            : "text-slate-500"
        }`}
      >
        {name}
      </p>

      {code && (
        <p className="mt-1 text-xs font-semibold text-slate-400">
          {code}
        </p>
      )}

      <p
        className={`mt-4 text-5xl font-black tracking-tight ${
          winner
            ? "text-[#E30613]"
            : "text-[#111827]"
        }`}
      >
        {score}
      </p>
    </div>
  );
}

function ResultMeta({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={
        align === "right"
          ? "sm:text-right"
          : ""
      }
    >
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-bold text-[#111827]">
        {value}
      </p>
    </div>
  );
}

function groupResultsBySport(
  results: any[]
) {
  return results.reduce(
    (
      groups: Record<string, any[]>,
      result
    ) => {
      const sportName =
        result.matches?.competitions
          ?.sports?.name ??
        "Other";

      if (!groups[sportName]) {
        groups[sportName] = [];
      }

      groups[sportName].push(result);

      return groups;
    },
    {}
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone: "Asia/Kuala_Lumpur",
      day: "numeric",
      month: "short",
    }
  ).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone: "Asia/Kuala_Lumpur",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  ).format(new Date(value));
}