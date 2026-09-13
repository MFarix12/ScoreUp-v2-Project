import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  generateTournament,
  updateParticipantSeeds,
} from "../actions";

interface TournamentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TournamentPage({
  params,
}: TournamentPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  /* =========================================================
     LOAD TOURNAMENT DATA
  ========================================================= */

  const [
    competitionResult,
    participantsResult,
    roundsResult,
    matchesResult,
  ] = await Promise.all([
    supabase
      .from("competitions")
      .select(`
        id,
        name,
        code,
        status,

        sports (
          id,
          name,

          games_editions (
            id,
            name,
            year
          )
        ),

        tournament_formats (
          id,
          name,
          code
        )
      `)
      .eq("id", id)
      .single(),

    supabase
      .from("competition_participants")
      .select(`
        id,
        seed_number,
        participant_type,
        status,

        teams (
          id,
          name,
          short_name,
          code
        )
      `)
      .eq("competition_id", id)
      .eq("status", "active")
      .order("seed_number", {
        ascending: true,
        nullsFirst: false,
      }),

    supabase
      .from("tournament_rounds")
      .select(`
        id,
        name,
        sequence_number,
        round_type,
        status,

        competition_stages!inner (
          competition_id
        )
      `)
      .eq(
        "competition_stages.competition_id",
        id
      )
      .order("sequence_number"),

    supabase
      .from("matches")
      .select(`
        id,
        match_code,
        match_number,
        status,
        round_id,
        group_id,

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
      `)
      .eq("competition_id", id)
      .order("match_number"),
  ]);

  /* =========================================================
     ERROR HANDLING
  ========================================================= */

  if (
    competitionResult.error ||
    !competitionResult.data
  ) {
    notFound();
  }

  if (participantsResult.error) {
    throw new Error(
      participantsResult.error.message
    );
  }

  if (roundsResult.error) {
    throw new Error(
      roundsResult.error.message
    );
  }

  if (matchesResult.error) {
    throw new Error(
      matchesResult.error.message
    );
  }

  /* =========================================================
     NORMALIZE DATA
  ========================================================= */

  const competition =
    competitionResult.data;

  const participants =
    participantsResult.data ?? [];

  const rounds =
    roundsResult.data ?? [];

  const matches =
    matchesResult.data ?? [];

  const generated =
    rounds.length > 0 ||
    matches.length > 0;

  const participantCount =
    participants.length;

  /* =========================================================
     TOURNAMENT FORMAT
  ========================================================= */

  const rawFormatCode =
    competition.tournament_formats
      ?.code ?? "";

  const rawFormatName =
    competition.tournament_formats
      ?.name ?? "";

  const formatCode =
    rawFormatCode
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");

  const formatName =
    rawFormatName
      .toLowerCase()
      .trim();

  const isSingleElimination =
    formatCode === "single_elimination" ||
    formatCode === "knockout" ||
    formatName.includes(
      "single elimination"
    );

  const isGroupKnockout =
    formatCode === "group_knockout" ||
    formatCode ===
      "group_stage_knockout" ||
    formatCode ===
      "group_stage_to_knockout" ||
    formatCode ===
      "group_to_knockout" ||
    (
      formatName.includes("group") &&
      formatName.includes("knockout")
    );

  /* =========================================================
     PARTICIPANT COUNT VALIDATION
  ========================================================= */

  const singleEliminationSupported =
    [2, 4, 8, 16, 32].includes(
      participantCount
    );

  /*
   * Initial ScoreUp Group → Knockout support:
   *
   * 6 participants
   * ↓
   * Group A = 3
   * Group B = 3
   * ↓
   * Top 2 from each group
   * ↓
   * 4-team Semi Final
   * ↓
   * Final
   */
  const groupKnockoutSupported =
    participantCount === 6;

  const supportedCount =
    isSingleElimination
      ? singleEliminationSupported
      : isGroupKnockout
        ? groupKnockoutSupported
        : false;

  /* =========================================================
     SEED VALIDATION
  ========================================================= */

  const seedNumbers =
    participants
      .map(
        (participant) =>
          participant.seed_number
      )
      .filter(
        (
          seed
        ): seed is number =>
          seed !== null
      );

  const allSeeded =
    participantCount > 0 &&
    seedNumbers.length ===
      participantCount;

  const uniqueSeeds =
    new Set(seedNumbers).size ===
    participantCount;

  const sequentialSeeds =
    allSeeded &&
    uniqueSeeds &&
    [...seedNumbers]
      .sort((a, b) => a - b)
      .every(
        (seed, index) =>
          seed === index + 1
      );

  /* =========================================================
     READINESS
  ========================================================= */

  const correctFormat =
    isSingleElimination ||
    isGroupKnockout;

  const canGenerate =
    !generated &&
    correctFormat &&
    supportedCount &&
    sequentialSeeds;

  /* =========================================================
     SERVER ACTIONS
  ========================================================= */

  const generateAction =
    generateTournament.bind(
      null,
      competition.id
    );

  const updateSeedsAction =
    updateParticipantSeeds.bind(
      null,
      competition.id
    );

  /* =========================================================
     GROUP PREVIEW
  ========================================================= */

  const sortedParticipants =
    [...participants].sort(
      (a, b) =>
        (a.seed_number ?? 999) -
        (b.seed_number ?? 999)
    );

  const groupAParticipants =
    sortedParticipants.filter(
      (participant) =>
        participant.seed_number === 1 ||
        participant.seed_number === 3 ||
        participant.seed_number === 5
    );

  const groupBParticipants =
    sortedParticipants.filter(
      (participant) =>
        participant.seed_number === 2 ||
        participant.seed_number === 4 ||
        participant.seed_number === 6
    );

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="space-y-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div>
        <Link
          href="/admin/tournaments"
          className="text-sm font-semibold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
        >
          ← Back to Tournaments
        </Link>

        <div className="mb-3 mt-5 h-1 w-12 rounded-full bg-[#E30613]" />

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold text-[#111827]">
              {competition.name}
            </h1>

            <p className="mt-2 text-slate-500">
              {competition
                .tournament_formats
                ?.name ?? "-"}
              {" · "}
              {competition.sports?.name ??
                "-"}
              {" · "}
              {competition.sports
                ?.games_editions?.name ??
                "-"}
            </p>
          </div>

          {!generated && (
            <form action={generateAction}>
              <button
                type="submit"
                disabled={!canGenerate}
                className="rounded-xl bg-[#E30613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B0000C] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Generate Tournament
              </button>
            </form>
          )}
        </div>
      </div>

      {/* =====================================================
          READINESS
      ===================================================== */}

      {!generated && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-bold text-[#111827]">
                Tournament Readiness
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Complete all requirements
                before generating the
                tournament.
              </p>
            </div>

            {canGenerate && (
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Ready to Generate
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <ReadinessCard
              label="Tournament Format"
              value={
                competition
                  .tournament_formats
                  ?.name ?? "-"
              }
              ready={correctFormat}
            />

            <ReadinessCard
              label="Participants"
              value={`${participantCount} registered`}
              ready={supportedCount}
            />

            <ReadinessCard
              label="Seed Numbers"
              value={
                sequentialSeeds
                  ? "Complete"
                  : "Action Required"
              }
              ready={sequentialSeeds}
            />
          </div>

          {/* SINGLE ELIMINATION INFO */}

          {isSingleElimination &&
            supportedCount && (
              <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-semibold">
                  Single Elimination
                </p>

                <p className="mt-1">
                  ScoreUp will generate a
                  standard knockout bracket
                  using the assigned seeds.
                </p>
              </div>
            )}

          {/* GROUP → KNOCKOUT INFO */}

          {isGroupKnockout &&
            supportedCount && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <p className="font-semibold">
                  Group Stage → Knockout
                </p>

                <p className="mt-1">
                  ScoreUp will create 2 groups
                  of 3 participants. The top 2
                  participants from each group
                  will qualify for the Semi
                  Finals.
                </p>
              </div>
            )}

          {/* INVALID PARTICIPANT COUNT */}

          {!supportedCount && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {isSingleElimination && (
                <>
                  Single Elimination currently
                  supports 2, 4, 8, 16 or 32
                  active participants.
                </>
              )}

              {isGroupKnockout && (
                <>
                  Group Stage to Knockout
                  currently supports 6 active
                  participants using 2 groups
                  of 3 teams. The top 2 teams
                  from each group advance to
                  the Semi Finals.
                </>
              )}

              {!isSingleElimination &&
                !isGroupKnockout && (
                  <>
                    This tournament format is
                    not yet supported by the
                    ScoreUp Tournament
                    Generator.
                  </>
                )}
            </div>
          )}

          {/* INVALID SEEDS */}

          {!sequentialSeeds &&
            participantCount > 0 && (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                Every participant must have
                one unique seed. Seeds must
                run sequentially from 1 to{" "}
                {participantCount}.
              </div>
            )}
        </section>
      )}

      {/* =====================================================
          SEED MANAGEMENT
      ===================================================== */}

      {!generated && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1 bg-[#E30613]" />

          <div className="p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-[#111827]">
                  Seed Management
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {isGroupKnockout
                    ? "Assign seeds used to distribute participants into the Group Stage."
                    : "Assign the bracket seed for each participant."}
                </p>
              </div>

              <span className="text-xs font-semibold text-slate-400">
                {participantCount}{" "}
                participants
              </span>
            </div>

            {isGroupKnockout && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-[#F5F6F8] p-4">
                <p className="text-sm font-semibold text-[#111827]">
                  Group distribution
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Seed 1, 3 and 5 will enter
                  Group A. Seed 2, 4 and 6
                  will enter Group B.
                </p>
              </div>
            )}

            {participants.length > 0 ? (
              <form
                action={updateSeedsAction}
                className="mt-6"
              >
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-5 py-4 font-semibold text-[#111827]">
                          Participant
                        </th>

                        <th className="px-5 py-4 font-semibold text-[#111827]">
                          Code
                        </th>

                        <th className="w-44 px-5 py-4 font-semibold text-[#111827]">
                          Seed
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {participants.map(
                        (participant) => (
                          <tr
                            key={
                              participant.id
                            }
                            className="transition hover:bg-slate-50/60"
                          >
                            <td className="px-5 py-4">
                              <p className="font-semibold text-[#111827]">
                                {participant
                                  .teams
                                  ?.name ??
                                  "Participant"}
                              </p>

                              {isGroupKnockout &&
                                participant.seed_number && (
                                  <p className="mt-1 text-xs text-slate-400">
                                    Current
                                    group:{" "}
                                    {participant
                                      .seed_number %
                                      2 ===
                                    1
                                      ? "Group A"
                                      : "Group B"}
                                  </p>
                                )}
                            </td>

                            <td className="px-5 py-4 text-slate-500">
                              {participant
                                .teams
                                ?.code ??
                                "-"}
                            </td>

                            <td className="px-5 py-4">
                              <input
                                type="number"
                                min="1"
                                max={
                                  participantCount
                                }
                                step="1"
                                required
                                name={`seed_${participant.id}`}
                                defaultValue={
                                  participant.seed_number ??
                                  ""
                                }
                                placeholder="Seed"
                                className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[#111827] placeholder:text-slate-400 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
                              />
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl border border-[#E30613] bg-white px-5 py-3 text-sm font-semibold text-[#E30613] transition hover:bg-red-50"
                  >
                    Save Seeds
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-[#F5F6F8] p-8 text-center">
                <p className="font-medium text-slate-600">
                  No participants
                  registered.
                </p>

                <Link
                  href="/admin/participants/new"
                  className="mt-3 inline-block text-sm font-semibold text-[#E30613] hover:underline"
                >
                  Register participants
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =====================================================
          GROUP ALLOCATION PREVIEW
      ===================================================== */}

      {!generated &&
        isGroupKnockout &&
        sequentialSeeds &&
        participantCount === 6 && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 bg-[#E30613]" />

            <div className="p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E30613]">
                    Group Allocation Preview
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-[#111827]">
                    2 Groups · 3 Teams Each
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Participants will be
                    distributed based on their
                    current seed numbers.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                  Allocation Ready
                </span>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <GroupPreview
                  name="Group A"
                  participants={
                    groupAParticipants
                  }
                />

                <GroupPreview
                  name="Group B"
                  participants={
                    groupBParticipants
                  }
                />
              </div>

              {/* QUALIFICATION */}

              <div className="mt-6 overflow-hidden rounded-2xl bg-[#111827]">
                <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">
                    Qualification Route
                  </p>

                  <h3 className="mt-2 text-lg font-bold text-white">
                    Group Stage → Semi Final
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Top 2 participants from
                    each group qualify for the
                    knockout stage.
                  </p>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                  <QualificationPreview
                    title="Semi Final 1"
                    home="Group A · 1st"
                    away="Group B · 2nd"
                  />

                  <QualificationPreview
                    title="Semi Final 2"
                    home="Group B · 1st"
                    away="Group A · 2nd"
                  />
                </div>

                <div className="border-t border-white/10 px-5 py-4 sm:px-6">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs font-black text-red-300">
                      !
                    </span>

                    <p className="text-xs leading-5 text-slate-400">
                      Semi Final
                      participants must only
                      be assigned after the
                      required Group Stage
                      results have become
                      official.
                    </p>
                  </div>
                </div>
              </div>

              {/* TOURNAMENT FLOW */}

              <div className="mt-6 rounded-2xl border border-slate-200 bg-[#F5F6F8] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Tournament Structure
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <TournamentFlowStep
                    number="01"
                    title="Group Stage"
                    description="6 round-robin matches"
                  />

                  <TournamentFlowStep
                    number="02"
                    title="Semi Final"
                    description="2 knockout matches"
                  />

                  <TournamentFlowStep
                    number="03"
                    title="Final"
                    description="1 championship match"
                  />
                </div>

                <div className="mt-4 rounded-xl bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        Total generated
                        matches
                      </p>

                      <p className="mt-1 text-lg font-black text-[#111827]">
                        9 Matches
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-400">
                        Knockout qualifiers
                      </p>

                      <p className="mt-1 text-lg font-black text-[#E30613]">
                        4 Teams
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      {/* =====================================================
          PARTICIPANT PREVIEW
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 rounded-t-2xl bg-[#E30613]" />

        <div className="p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#111827]">
                Participants
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current active participants
                for this competition.
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              {participantCount} Active
            </span>
          </div>

          {participants.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {participants.map(
                (participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-red-200"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold ${
                        participant.seed_number
                          ? "bg-red-50 text-[#E30613]"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {participant.seed_number ??
                        "—"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#111827]">
                        {participant
                          .teams
                          ?.name ??
                          "Participant"}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="text-xs text-slate-400">
                          {participant.seed_number
                            ? `Seed ${participant.seed_number}`
                            : "Seed not assigned"}
                        </p>

                        {isGroupKnockout &&
                          participant.seed_number && (
                            <>
                              <span className="text-slate-300">
                                ·
                              </span>

                              <p className="text-xs font-semibold text-[#E30613]">
                                {participant
                                  .seed_number %
                                  2 ===
                                1
                                  ? "Group A"
                                  : "Group B"}
                              </p>
                            </>
                          )}
                      </div>
                    </div>

                    {participant.teams
                      ?.code && (
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {
                          participant
                            .teams.code
                        }
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-[#F5F6F8] p-8 text-center">
              <p className="text-sm text-slate-500">
                No active participants
                registered.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          GENERATED TOURNAMENT
      ===================================================== */}

      {generated && (
        <section>
          <div className="mb-5">
            <div className="mb-3 h-1 w-12 rounded-full bg-[#E30613]" />

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E30613]">
                  Generated Tournament
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#111827]">
                  Tournament Bracket
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Winners automatically
                  advance through the
                  configured progression
                  routes.
                </p>
              </div>

              <span className="w-fit rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                Generated
              </span>
            </div>
          </div>

          {rounds.length > 0 ? (
            <div className="grid gap-6 xl:grid-cols-3">
              {rounds.map((round) => {
                const roundMatches =
                  matches.filter(
                    (match) =>
                      match.round_id ===
                      round.id
                  );

                return (
                  <div
                    key={round.id}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="font-bold text-[#111827]">
                        {round.name}
                      </h3>

                      <p className="mt-1 text-xs capitalize text-slate-400">
                        {round.status}
                      </p>
                    </div>

                    {roundMatches.length >
                    0 ? (
                      roundMatches.map(
                        (match) => (
                          <div
                            key={
                              match.id
                            }
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                          >
                            <div className="flex items-center justify-between bg-[#111827] px-4 py-2 text-xs text-white">
                              <span className="font-semibold">
                                {match.match_code}
                              </span>

                              <span className="capitalize text-slate-300">
                                {match.status}
                              </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                              <MatchTeam
                                name={
                                  match
                                    .home
                                    ?.teams
                                    ?.name ??
                                  "TBD"
                                }
                              />

                              <MatchTeam
                                name={
                                  match
                                    .away
                                    ?.teams
                                    ?.name ??
                                  "TBD"
                                }
                              />
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-400">
                        No matches in this
                        round yet.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-medium text-[#111827]">
                Tournament structure
                generated.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                No knockout rounds are
                currently available to
                display.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* =========================================================
   READINESS CARD
========================================================= */

function ReadinessCard({
  label,
  value,
  ready,
}: {
  label: string;
  value: string;
  ready: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#F5F6F8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 font-semibold text-[#111827]">
            {value}
          </p>
        </div>

        <span
          className={`mt-1 h-3 w-3 rounded-full ${
            ready
              ? "bg-green-500"
              : "bg-amber-500"
          }`}
        />
      </div>
    </div>
  );
}

/* =========================================================
   GROUP PREVIEW
========================================================= */

function GroupPreview({
  name,
  participants,
}: {
  name: string;
  participants: any[];
}) {
  const sorted =
    [...participants].sort(
      (a, b) =>
        (a.seed_number ?? 0) -
        (b.seed_number ?? 0)
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between bg-[#111827] px-5 py-4 text-white">
        <div>
          <p className="font-bold">
            {name}
          </p>

          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">
            Group Stage
          </p>
        </div>

        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
          {participants.length} Teams
        </span>
      </div>

      <div className="divide-y divide-slate-100 bg-white">
        {sorted.map(
          (participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xs font-black text-[#E30613]">
                  {
                    participant.seed_number
                  }
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#111827]">
                    {participant
                      .teams
                      ?.name ??
                      "Participant"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Seed{" "}
                    {
                      participant.seed_number
                    }
                  </p>
                </div>
              </div>

              {participant.teams
                ?.code && (
                <span className="shrink-0 text-xs font-bold text-slate-400">
                  {
                    participant.teams
                      .code
                  }
                </span>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   QUALIFICATION PREVIEW
========================================================= */

function QualificationPreview({
  title,
  home,
  away,
}: {
  title: string;
  home: string;
  away: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-white">
          {title}
        </p>

        <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-red-300">
          Knockout
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="rounded-lg bg-white/[0.05] px-3 py-2.5 text-sm font-semibold text-slate-200">
          {home}
        </div>

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10" />

          <span className="text-[9px] font-black text-slate-500">
            VS
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="rounded-lg bg-white/[0.05] px-3 py-2.5 text-sm font-semibold text-slate-200">
          {away}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TOURNAMENT FLOW
========================================================= */

function TournamentFlowStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[10px] font-black text-[#E30613]">
        {number}
      </div>

      <p className="mt-3 text-sm font-bold text-[#111827]">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   MATCH TEAM
========================================================= */

function MatchTeam({
  name,
}: {
  name: string;
}) {
  return (
    <div className="flex min-h-14 items-center px-4 py-3">
      <p
        className={
          name === "TBD"
            ? "font-medium text-slate-400"
            : "font-semibold text-[#111827]"
        }
      >
        {name}
      </p>
    </div>
  );
}