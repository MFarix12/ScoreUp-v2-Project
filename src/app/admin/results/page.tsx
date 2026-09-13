import Link from "next/link";

import {
  CheckCircle2,
  Clock3,
  Eye,
  History,
  PencilLine,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminResultsPage() {
  await requireAdmin();

  const supabase = await createClient();

  const {
    data: results,
    error,
  } = await supabase
    .from("match_results")
    .select(`
      id,
      match_id,
      home_score,
      away_score,
      result_status,
      result_type,
      supersedes_result_id,
      submitted_at,
      official_at,
      is_published,

      matches (
        id,
        match_code,
        status,

        competitions (
          id,
          name,

          sports (
            name
          )
        ),

        tournament_rounds (
          name
        ),

        home:competition_participants!matches_home_participant_fk (
          id,

          teams (
            name
          )
        ),

        away:competition_participants!matches_away_participant_fk (
          id,

          teams (
            name
          )
        )
      ),

      submitted_profile:user_profiles!match_results_submitted_by_fk (
        full_name
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const resultRows =
    results ?? [];

  const pendingCount =
    resultRows.filter(
      (result) =>
        result.result_status ===
        "pending_validation"
    ).length;

  const officialCount =
    resultRows.filter(
      (result) =>
        result.result_status ===
        "official"
    ).length;

  const correctedCount =
    resultRows.filter(
      (result) =>
        result.result_status ===
        "corrected"
    ).length;

  return (
    <div className="space-y-8">
      {/* ===================================================
          HEADER
      =================================================== */}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 h-1 w-12 rounded-full bg-[#E30613]" />

          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E30613]">
            Score & Result Management
          </p>

          <h1 className="mt-1 text-3xl font-black text-[#111827]">
            Match Results
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review submitted results, validate official
            outcomes, and safely correct official results
            while preserving the competition audit history.
          </p>
        </div>

        <Link
          href="/admin/matches"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#111827] shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-[#E30613]"
        >
          View Matches
        </Link>
      </div>

      {/* ===================================================
          SUMMARY CARDS
      =================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Results"
          value={resultRows.length}
          icon={
            <History className="h-5 w-5" />
          }
        />

        <SummaryCard
          label="Awaiting Validation"
          value={pendingCount}
          icon={
            <Clock3 className="h-5 w-5" />
          }
        />

        <SummaryCard
          label="Official Results"
          value={officialCount}
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
        />

        <SummaryCard
          label="Corrected History"
          value={correctedCount}
          icon={
            <PencilLine className="h-5 w-5" />
          }
        />
      </div>

      {/* ===================================================
          RESULT CARDS
      =================================================== */}
      <div className="space-y-4">
        {resultRows.map((result) => {
          const match =
            result.matches;

          const homeName =
            match?.home?.teams?.name ??
            "TBD";

          const awayName =
            match?.away?.teams?.name ??
            "TBD";

          const isPending =
            result.result_status ===
            "pending_validation";

          const isOfficial =
            result.result_status ===
            "official";

          const isCorrected =
            result.result_status ===
            "corrected";

          return (
            <article
              key={result.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              {/* -------------------------------------------
                  CARD HEADER
              ------------------------------------------- */}
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#E30613]">
                      {match?.match_code ??
                        "MATCH"}
                    </p>

                    <ResultStatus
                      status={
                        result.result_status
                      }
                    />
                  </div>

                  <h2 className="mt-2 text-lg font-black text-[#111827]">
                    {match?.competitions
                      ?.name ??
                      "Competition"}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span>
                      {match?.competitions
                        ?.sports?.name ??
                        "Sport"}
                    </span>

                    <span className="hidden sm:inline">
                      •
                    </span>

                    <span>
                      {match
                        ?.tournament_rounds
                        ?.name ??
                        "Match"}
                    </span>
                  </div>
                </div>

                <div className="text-left lg:text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Result Type
                  </p>

                  <p className="mt-1 text-sm font-bold capitalize text-[#111827]">
                    {result.result_type.replaceAll(
                      "_",
                      " "
                    )}
                  </p>
                </div>
              </div>

              {/* -------------------------------------------
                  SCORE
              ------------------------------------------- */}
              <div className="grid md:grid-cols-[1fr_auto_1fr]">
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Home
                  </p>

                  <p className="mt-2 font-black text-[#111827]">
                    {homeName}
                  </p>

                  <p className="mt-4 text-4xl font-black text-[#111827]">
                    {result.home_score ??
                      "-"}
                  </p>
                </div>

                <div className="hidden items-center justify-center px-5 font-black text-slate-300 md:flex">
                  VS
                </div>

                <div className="border-t border-slate-100 p-6 md:border-l md:border-t-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Away
                  </p>

                  <p className="mt-2 font-black text-[#111827]">
                    {awayName}
                  </p>

                  <p className="mt-4 text-4xl font-black text-[#111827]">
                    {result.away_score ??
                      "-"}
                  </p>
                </div>
              </div>

              {/* -------------------------------------------
                  FOOTER
              ------------------------------------------- */}
              <div className="flex flex-col justify-between gap-4 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6 lg:flex-row lg:items-center">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-slate-500">
                    Submitted by
                  </p>

                  <p className="text-sm font-bold text-[#111827]">
                    {result.submitted_profile
                      ?.full_name ??
                      "Unknown"}
                  </p>

                  {isCorrected &&
                    result.supersedes_result_id && (
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        Historical result retained after
                        correction.
                      </p>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Pending result */}
                  {isPending && (
                    <Link
                      href={`/admin/results/${result.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E30613] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B0000C]"
                    >
                      <Eye className="h-4 w-4" />
                      Review Result
                    </Link>
                  )}

                  {/* Official result */}
                  {isOfficial && (
                    <>
                      <Link
                        href={`/admin/results/${result.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#111827] transition hover:border-red-200 hover:bg-red-50 hover:text-[#E30613]"
                      >
                        <Eye className="h-4 w-4" />
                        View Result
                      </Link>

                      <Link
                        href={`/admin/results/${result.id}/correct`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#E30613]"
                      >
                        <PencilLine className="h-4 w-4" />
                        Correct Result
                      </Link>
                    </>
                  )}

                  {/* Historical corrected result */}
                  {isCorrected && (
                    <Link
                      href={`/admin/results/${result.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      <History className="h-4 w-4" />
                      View History
                    </Link>
                  )}

                  {/* Other statuses */}
                  {!isPending &&
                    !isOfficial &&
                    !isCorrected && (
                      <Link
                        href={`/admin/results/${result.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#111827] transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        <Eye className="h-4 w-4" />
                        View Result
                      </Link>
                    )}
                </div>
              </div>
            </article>
          );
        })}

        {resultRows.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <XCircle className="h-5 w-5" />
            </div>

            <h2 className="mt-4 font-black text-[#111827]">
              No match results yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Submitted technician results will appear here
              for Administrator review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black text-[#111827]">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-[#E30613]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ResultStatus({
  status,
}: {
  status: string;
}) {
  if (status === "official") {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        Official
      </span>
    );
  }

  if (
    status ===
    "pending_validation"
  ) {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
        Awaiting Validation
      </span>
    );
  }

  if (status === "corrected") {
    return (
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
        Corrected History
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
        Cancelled
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">
      {status.replaceAll(
        "_",
        " "
      )}
    </span>
  );
}
