import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function TechnicianMatchesPage() {
  const supabase = await createClient();

  /*
   * Keep the primary match query relatively small.
   * RLS automatically limits matches to competitions
   * assigned to the logged-in technician.
   */
  const { data: matches, error: matchesError } =
    await supabase
      .from("matches")
      .select(`
        id,
        competition_id,
        round_id,
        match_code,
        match_number,
        status,
        home_participant_id,
        away_participant_id
      `)
      .order("match_number", {
        ascending: true,
      });

  if (matchesError) {
    console.error(
      "Technician matches query:",
      matchesError
    );

    throw new Error(
      `Unable to load technician matches: ${matchesError.message}`
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader />

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-semibold text-[#111827]">
            No assigned matches
          </p>

          <p className="mt-2 text-sm text-slate-500">
            No matches are currently available for
            your technician assignment.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Collect IDs so related data can be loaded
   * using smaller queries.
   */
  const competitionIds = [
    ...new Set(
      matches.map(
        (match) => match.competition_id
      )
    ),
  ];

  const roundIds = [
    ...new Set(
      matches
        .map((match) => match.round_id)
        .filter(
          (id): id is string =>
            id !== null
        )
    ),
  ];

  const participantIds = [
    ...new Set(
      matches.flatMap((match) =>
        [
          match.home_participant_id,
          match.away_participant_id,
        ].filter(
          (id): id is string =>
            id !== null
        )
      )
    ),
  ];

  const matchIds = matches.map(
    (match) => match.id
  );

  /*
   * Load related information separately.
   */
  const [
    competitionsResult,
    roundsResult,
    participantsResult,
    resultsResult,
  ] = await Promise.all([
    supabase
      .from("competitions")
      .select(`
        id,
        name,
        sports (
          id,
          name
        )
      `)
      .in("id", competitionIds),

    roundIds.length > 0
      ? supabase
          .from("tournament_rounds")
          .select(`
            id,
            name
          `)
          .in("id", roundIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    participantIds.length > 0
      ? supabase
          .from(
            "competition_participants"
          )
          .select(`
            id,
            teams (
              id,
              name,
              code
            )
          `)
          .in("id", participantIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    supabase
      .from("match_results")
      .select(`
        id,
        match_id,
        result_status,
        home_score,
        away_score
      `)
      .in("match_id", matchIds)
      .in("result_status", [
        "pending_validation",
        "official",
      ]),
  ]);

  if (competitionsResult.error) {
    throw new Error(
      competitionsResult.error.message
    );
  }

  if (roundsResult.error) {
    throw new Error(
      roundsResult.error.message
    );
  }

  if (participantsResult.error) {
    throw new Error(
      participantsResult.error.message
    );
  }

  if (resultsResult.error) {
    throw new Error(
      resultsResult.error.message
    );
  }

  const competitions =
    competitionsResult.data ?? [];

  const rounds =
    roundsResult.data ?? [];

  const participants =
    participantsResult.data ?? [];

  const results =
    resultsResult.data ?? [];

  function getCompetition(
    competitionId: string
  ) {
    return competitions.find(
      (competition) =>
        competition.id ===
        competitionId
    );
  }

  function getRound(
    roundId: string | null
  ) {
    if (!roundId) {
      return null;
    }

    return rounds.find(
      (round) =>
        round.id === roundId
    );
  }

  function getParticipant(
    participantId: string | null
  ) {
    if (!participantId) {
      return null;
    }

    return participants.find(
      (participant) =>
        participant.id ===
        participantId
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader />

      <div className="space-y-4">
        {matches.map((match) => {
          const competition =
            getCompetition(
              match.competition_id
            );

          const round =
            getRound(match.round_id);

          const home =
            getParticipant(
              match.home_participant_id
            );

          const away =
            getParticipant(
              match.away_participant_id
            );

          const matchResults =
            results.filter(
              (result) =>
                result.match_id ===
                match.id
            );

          const pending =
            matchResults.find(
              (result) =>
                result.result_status ===
                "pending_validation"
            );

          const official =
            matchResults.find(
              (result) =>
                result.result_status ===
                "official"
            );

          const canEnterResult =
            match.home_participant_id !==
              null &&
            match.away_participant_id !==
              null &&
            !pending &&
            !official;

          return (
            <div
              key={match.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Match Header */}
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#E30613]">
                    {match.match_code}
                  </p>

                  <h2 className="mt-1 font-bold text-[#111827]">
                    {competition?.name ??
                      "Competition"}
                  </h2>

                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>
                      {competition?.sports
                        ?.name ?? "Sport"}
                    </span>

                    <span>•</span>

                    <span>
                      {round?.name ??
                        "Match"}
                    </span>
                  </div>
                </div>

                <MatchStatus
                  matchStatus={
                    match.status
                  }
                  hasPending={
                    Boolean(pending)
                  }
                  hasOfficial={
                    Boolean(official)
                  }
                />
              </div>

              {/* Teams */}
              <div className="grid md:grid-cols-[1fr_auto_1fr]">
                <TeamPanel
                  label="Home"
                  name={
                    home?.teams
                      ?.name ?? "TBD"
                  }
                  score={
                    official?.home_score
                  }
                />

                <div className="hidden items-center justify-center px-5 font-bold text-slate-300 md:flex">
                  VS
                </div>

                <TeamPanel
                  label="Away"
                  name={
                    away?.teams
                      ?.name ?? "TBD"
                  }
                  score={
                    official?.away_score
                  }
                  right
                />
              </div>

              {/* Action */}
              {canEnterResult && (
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-right">
                  <Link
                    href={`/technician/matches/${match.id}`}
                    className="inline-block rounded-xl bg-[#E30613] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B0000C]"
                  >
                    Enter Result
                  </Link>
                </div>
              )}

              {pending && (
                <div className="border-t border-amber-100 bg-amber-50 px-6 py-4">
                  <p className="text-sm font-medium text-amber-800">
                    Result submitted and
                    awaiting Administrator
                    validation.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <div className="mb-3 h-1 w-12 rounded-full bg-[#E30613]" />

      <h1 className="text-3xl font-bold text-[#111827]">
        Matches
      </h1>

      <p className="mt-2 text-slate-500">
        Enter results for your assigned
        matches.
      </p>
    </div>
  );
}

function MatchStatus({
  matchStatus,
  hasPending,
  hasOfficial,
}: {
  matchStatus: string;
  hasPending: boolean;
  hasOfficial: boolean;
}) {
  if (hasOfficial) {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
        Official
      </span>
    );
  }

  if (hasPending) {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        Awaiting Validation
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
      {matchStatus.replaceAll(
        "_",
        " "
      )}
    </span>
  );
}

function TeamPanel({
  label,
  name,
  score,
  right = false,
}: {
  label: string;
  name: string;
  score?: number | null;
  right?: boolean;
}) {
  return (
    <div
      className={`p-6 ${
        right
          ? "border-t border-slate-100 md:border-l md:border-t-0"
          : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-lg font-bold ${
          name === "TBD"
            ? "text-slate-400"
            : "text-[#111827]"
        }`}
      >
        {name}
      </p>

      {score !== undefined &&
        score !== null && (
          <p className="mt-3 text-3xl font-black text-[#111827]">
            {score}
          </p>
        )}
    </div>
  );
}