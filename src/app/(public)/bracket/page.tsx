import Link from "next/link";

import { PublicEmptyState } from "@/components/public/public-empty-state";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { TeamLogo } from "@/components/public/team-logo";
import { createClient } from "@/lib/supabase/server";

// =========================================================
// TYPES
// =========================================================

type TeamRow = {
  id: string;
  name: string;
  code: string | null;
  logo_url: string | null;
};

type ParticipantRow = {
  id: string;
  teams: TeamRow | null;
};

type ResultRow = {
  id: string;
  home_score: number;
  away_score: number;
  result_status: string;
  is_published: boolean;
  winner_participant_id: string | null;
  loser_participant_id: string | null;
  official_at: string | null;
};

type ScheduleRow = {
  id: string;
  scheduled_start: string;
  schedule_status: string;
  is_current: boolean;
  is_published: boolean;
  venues: {
    id: string;
    name: string;
    code: string | null;
  } | null;
};

type MatchRow = {
  id: string;
  match_number: number | null;
  match_code: string | null;
  status: string;
  is_published: boolean;
  home: ParticipantRow | null;
  away: ParticipantRow | null;
  match_results: ResultRow[] | null;
  match_schedules: ScheduleRow[] | null;
};

type RoundRow = {
  id: string;
  name: string;
  round_number: number;
  sequence_number: number;
  round_type: string;
  is_final_round: boolean;
  status: string;
  matches: MatchRow[] | null;
};

type StageRow = {
  id: string;
  name: string;
  stage_type: string;
  sequence_number: number;
  status: string;

  competitions: {
    id: string;
    name: string;
    status: string;

    sports: {
      id: string;
      name: string;
    } | null;
  } | null;

  tournament_rounds: RoundRow[] | null;
};

type PreparedMatch = MatchRow & {
  officialResult: ResultRow | null;
  currentSchedule: ScheduleRow | null;
};

type PreparedRound = Omit<RoundRow, "matches"> & {
  stageName: string;
  matches: PreparedMatch[];
};

type CompetitionBracketData = {
  id: string;
  name: string;
  sportName: string;
  status: string;
  rounds: PreparedRound[];
};

// =========================================================
// PAGE
// =========================================================

export default async function PublicBracketPage() {
  const supabase = await createClient();

  // =====================================================
  // 1. LOAD PUBLIC KNOCKOUT BRACKET
  // =====================================================

  const {
    data: stagesData,
    error,
  } = await supabase
    .from("competition_stages")
    .select(`
      id,
      name,
      stage_type,
      sequence_number,
      status,

      competitions!inner (
        id,
        name,
        status,

        sports!inner (
          id,
          name,

          games_editions!inner (
            id,
            is_public
          )
        )
      ),

      tournament_rounds (
        id,
        name,
        round_number,
        sequence_number,
        round_type,
        is_final_round,
        status,

        matches (
          id,
          match_number,
          match_code,
          status,
          is_published,

          home:competition_participants!matches_home_participant_fk (
            id,

            teams (
              id,
              name,
              code,
              logo_url
            )
          ),

          away:competition_participants!matches_away_participant_fk (
            id,

            teams (
              id,
              name,
              code,
              logo_url
            )
          ),

          match_results (
            id,
            home_score,
            away_score,
            result_status,
            is_published,
            winner_participant_id,
            loser_participant_id,
            official_at
          ),

          match_schedules (
            id,
            scheduled_start,
            schedule_status,
            is_current,
            is_published,

            venues (
              id,
              name,
              code
            )
          )
        )
      )
    `)
    .eq("stage_type", "knockout")
    .eq(
      "competitions.sports.games_editions.is_public",
      true
    )
    .order("sequence_number", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Public bracket error:",
      error
    );
  }

  const stages =
    (stagesData ?? []) as unknown as StageRow[];

  const competitions =
    prepareCompetitions(stages);

  return (
    <>
      <PublicPageHeader
        eyebrow="SuperUPSI Games"
        title="Tournament Bracket"
        description="Follow the knockout journey from the semi-finals to the third-place playoff and championship final."
      />

      <section className="mx-auto max-w-[1600px] px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* ================================================= */}
        {/* NAVIGATION */}
        {/* ================================================= */}

        <div className="mb-8 flex flex-col justify-between gap-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E30613]">
              Knockout Centre
            </p>

            <h2 className="mt-2 text-xl font-black text-[#111827]">
              Road to the Championship
            </h2>

            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              Official published knockout fixtures,
              results and tournament progression.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/fixtures"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#111827] transition hover:border-red-200 hover:bg-red-50 hover:text-[#E30613]"
            >
              Fixtures
            </Link>

            <Link
              href="/schedule"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#111827] transition hover:border-red-200 hover:bg-red-50 hover:text-[#E30613]"
            >
              Schedule
            </Link>

            <Link
              href="/results"
              className="rounded-xl bg-[#E30613] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B0000C]"
            >
              Results
            </Link>
          </div>
        </div>

        {competitions.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 shadow-sm">
            <PublicEmptyState
              title="No published bracket yet"
              description="The tournament bracket will appear here after knockout matches have been generated and published."
              icon="B"
            />
          </div>
        ) : (
          <div className="space-y-12">
            {competitions.map(
              (competition) => (
                <CompetitionBracket
                  key={competition.id}
                  competition={competition}
                />
              )
            )}
          </div>
        )}
      </section>
    </>
  );
}

// =========================================================
// COMPETITION BRACKET
// =========================================================

function CompetitionBracket({
  competition,
}: {
  competition: CompetitionBracketData;
}) {
  const semiFinalRound =
    competition.rounds.find(
      (round) =>
        round.round_type ===
        "semi_final"
    ) ?? null;

  const thirdPlaceRound =
    competition.rounds.find(
      (round) =>
        round.round_type ===
        "third_place"
    ) ?? null;

  const finalRound =
    competition.rounds.find(
      (round) =>
        round.round_type ===
        "final"
    ) ?? null;

  const otherRounds =
    competition.rounds.filter(
      (round) =>
        ![
          "semi_final",
          "third_place",
          "final",
        ].includes(
          round.round_type
        )
    );

  const allMatches =
    competition.rounds.flatMap(
      (round) =>
        round.matches
    );

  const completedMatches =
    allMatches.filter(
      (match) =>
        match.officialResult
    ).length;

  const totalMatches =
    allMatches.length;

  const finalMatch =
    finalRound?.matches?.[0] ??
    null;

  const champion =
    finalMatch?.officialResult
      ? getWinningParticipant(
          finalMatch
        )
      : null;

  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="relative overflow-hidden bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#7f1018] px-6 py-7 text-white sm:px-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border-[26px] border-white/5" />

        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
              {competition.sportName}
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              {competition.name}
            </h2>

            <p className="mt-2 text-sm text-slate-300">
              Knockout Tournament Bracket
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-slate-200">
              {completedMatches}/{totalMatches} Official
            </span>

            <span
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${
                champion
                  ? "bg-[#E30613] text-white"
                  : "border border-white/10 bg-white/[0.06] text-slate-300"
              }`}
            >
              {champion
                ? "Tournament Complete"
                : "Tournament In Progress"}
            </span>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* CHAMPION */}
      {/* ================================================= */}

      {champion && (
        <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 via-white to-red-50 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl shadow-sm">
                🏆
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                  Champion
                </p>

                <p className="mt-1 text-xl font-black text-[#111827]">
                  {champion.teams?.name ??
                    "Champion"}
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full bg-[#111827] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
              Final Winner
            </span>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MAIN BRACKET */}
      {/* ================================================= */}

      <div className="bg-[#F5F6F8] p-5 sm:p-7 lg:p-8">
        {semiFinalRound ||
        thirdPlaceRound ||
        finalRound ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr_0.9fr]">
              <BracketRoundPanel
                title={
                  semiFinalRound?.name ??
                  "Semi Final"
                }
                eyebrow="Stage 1"
                subtitle="Winners advance to the Final. Losers move to the Third Place match."
                round={semiFinalRound}
                accent="red"
                emptyText="Semi-final matches have not been published yet."
              />

              <BracketRoundPanel
                title={
                  thirdPlaceRound?.name ??
                  "Third Place"
                }
                eyebrow="Placement Match"
                subtitle="Semi-final losers compete for third place."
                round={thirdPlaceRound}
                accent="charcoal"
                emptyText="Third-place match is waiting for both semi-final losers."
              />

              <BracketRoundPanel
                title={
                  finalRound?.name ??
                  "Final"
                }
                eyebrow="Championship Match"
                subtitle="Semi-final winners compete for the championship."
                round={finalRound}
                accent="gold"
                emptyText="The Final is waiting for both semi-final winners."
              />
            </div>

            <ProgressionGuide />
          </>
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8">
            <PublicEmptyState
              title="Knockout rounds are not available"
              description="Published knockout matches will appear here once the competition reaches the elimination stage."
            />
          </div>
        )}

        {otherRounds.length > 0 && (
          <div className="mt-8">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E30613]">
                Additional Rounds
              </p>

              <h3 className="mt-1 text-xl font-black text-[#111827]">
                Earlier Knockout Matches
              </h3>
            </div>

            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {otherRounds.map(
                (round) => (
                  <BracketRoundPanel
                    key={round.id}
                    title={round.name}
                    eyebrow={round.stageName}
                    subtitle={`${round.matches.length} published ${
                      round.matches.length === 1
                        ? "match"
                        : "matches"
                    }`}
                    round={round}
                    accent="slate"
                    emptyText="No published matches in this round."
                  />
                )
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// =========================================================
// ROUND PANEL
// =========================================================

function BracketRoundPanel({
  title,
  eyebrow,
  subtitle,
  round,
  accent,
  emptyText,
}: {
  title: string;
  eyebrow: string;
  subtitle: string;
  round: PreparedRound | null;
  accent:
    | "red"
    | "charcoal"
    | "gold"
    | "slate";
  emptyText: string;
}) {
  const headerClass =
    accent === "red"
      ? "bg-gradient-to-r from-[#9F0A13] to-[#E30613]"
      : accent === "charcoal"
      ? "bg-gradient-to-r from-[#111827] to-[#263244]"
      : accent === "gold"
      ? "bg-gradient-to-r from-[#7C5A09] via-[#B8860B] to-[#D6A51A]"
      : "bg-gradient-to-r from-slate-700 to-slate-900";

  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
      <div
        className={`relative overflow-hidden px-5 py-5 text-white ${headerClass}`}
      >
        <div className="absolute -right-7 -top-10 h-28 w-28 rounded-full border-[14px] border-white/10" />

        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">
            {eyebrow}
          </p>

          <h3 className="mt-1 text-xl font-black">
            {title}
          </h3>

          <p className="mt-2 max-w-sm text-xs leading-5 text-white/70">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {round &&
        round.matches.length > 0 ? (
          round.matches.map(
            (match) => (
              <BracketMatch
                key={match.id}
                match={match}
                roundType={
                  round.round_type
                }
              />
            )
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-7 text-center">
            <p className="text-sm font-semibold leading-6 text-slate-400">
              {emptyText}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// =========================================================
// BRACKET MATCH
// =========================================================

function BracketMatch({
  match,
  roundType,
}: {
  match: PreparedMatch;
  roundType: string;
}) {
  const result =
    match.officialResult;

  const homeName =
    match.home?.teams?.name ??
    "TBD";

  const awayName =
    match.away?.teams?.name ??
    "TBD";

  const homeCode =
    match.home?.teams?.code ??
    "";

  const awayCode =
    match.away?.teams?.code ??
    "";

  const homeLogoUrl =
    match.home?.teams?.logo_url ?? null;

  const awayLogoUrl =
    match.away?.teams?.logo_url ?? null;

  const winnerId =
    result?.winner_participant_id ??
    null;

  const homeWon =
    Boolean(
      result &&
        winnerId &&
        winnerId === match.home?.id
    );

  const awayWon =
    Boolean(
      result &&
        winnerId &&
        winnerId === match.away?.id
    );

  const matchLabel =
    roundType === "final"
      ? "Final"
      : roundType ===
        "third_place"
      ? "Third Place"
      : roundType ===
        "semi_final"
      ? "Semi Final"
      : "Knockout";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`h-1 ${
          roundType === "final"
            ? "bg-amber-400"
            : result
            ? "bg-[#E30613]"
            : "bg-slate-300"
        }`}
      />

      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[10px] font-black uppercase tracking-wider text-[#E30613]">
            {match.match_code ??
              "Match"}
          </span>

          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-slate-500">
            {matchLabel}
          </span>
        </div>

        <MatchStatus
          match={match}
        />
      </div>

      <div className="divide-y divide-slate-100">
        <BracketTeam
          name={homeName}
          code={homeCode}
          logoUrl={homeLogoUrl}
          score={
            result
              ? result.home_score
              : undefined
          }
          winner={homeWon}
        />

        <BracketTeam
          name={awayName}
          code={awayCode}
          logoUrl={awayLogoUrl}
          score={
            result
              ? result.away_score
              : undefined
          }
          winner={awayWon}
        />
      </div>

      <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
        {match.currentSchedule ? (
          <div className="flex flex-col gap-1 text-[10px] font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {formatMatchDate(
                match.currentSchedule
                  .scheduled_start
              )}
            </span>

            <span>
              {match.currentSchedule
                .venues?.name ??
                "Venue TBA"}
            </span>
          </div>
        ) : (
          <p className="text-[10px] font-semibold text-slate-400">
            Schedule to be confirmed
          </p>
        )}
      </div>
    </article>
  );
}

// =========================================================
// TEAM ROW
// =========================================================

function BracketTeam({
  name,
  code,
  logoUrl,
  score,
  winner,
}: {
  name: string;
  code?: string;
  logoUrl?: string | null;
  score?: number;
  winner: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3.5 ${
        winner
          ? "bg-red-50/80"
          : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <TeamLogo name={name} code={code} logoUrl={logoUrl} size="sm" />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {winner && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E30613] text-[9px] font-black text-white">
                W
              </span>
            )}

            <p
              className={`truncate text-sm font-black ${
                winner
                  ? "text-[#111827]"
                  : "text-slate-600"
              }`}
            >
              {name}
            </p>
          </div>

          {code && (
            <p className="mt-1 text-[10px] font-semibold text-slate-400">
              {code}
            </p>
          )}
        </div>
      </div>

      {score !== undefined ? (
        <span
          className={`text-xl font-black ${
            winner
              ? "text-[#E30613]"
              : "text-[#111827]"
          }`}
        >
          {score}
        </span>
      ) : (
        <span className="text-xs font-black text-slate-300">
          —
        </span>
      )}
    </div>
  );
}

// =========================================================
// MATCH STATUS
// =========================================================

function MatchStatus({
  match,
}: {
  match: PreparedMatch;
}) {
  if (match.officialResult) {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-emerald-700">
        Official
      </span>
    );
  }

  if (
    match.currentSchedule
      ?.schedule_status ===
    "postponed"
  ) {
    return (
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-amber-700">
        Postponed
      </span>
    );
  }

  if (match.currentSchedule) {
    return (
      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-blue-700">
        Upcoming
      </span>
    );
  }

  if (
    match.home &&
    match.away
  ) {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-[#E30613]">
        Ready
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-slate-500">
      TBD
    </span>
  );
}

// =========================================================
// PROGRESSION GUIDE
// =========================================================

function ProgressionGuide() {
  return (
    <div className="mt-7 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E30613]">
            Progression
          </p>

          <h3 className="mt-1 text-lg font-black text-[#111827]">
            How teams advance
          </h3>
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-4xl lg:grid-cols-4">
          <ProgressionItem
            label="SF-01 Winner"
            destination="FINAL-10"
            tone="red"
          />

          <ProgressionItem
            label="SF-02 Winner"
            destination="FINAL-10"
            tone="red"
          />

          <ProgressionItem
            label="SF-01 Loser"
            destination="THIRD-09"
            tone="dark"
          />

          <ProgressionItem
            label="SF-02 Loser"
            destination="THIRD-09"
            tone="dark"
          />
        </div>
      </div>
    </div>
  );
}

function ProgressionItem({
  label,
  destination,
  tone,
}: {
  label: string;
  destination: string;
  tone: "red" | "dark";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-slate-300">
          →
        </span>

        <span
          className={`rounded-lg px-2.5 py-1 text-xs font-black ${
            tone === "red"
              ? "bg-red-50 text-[#E30613]"
              : "bg-[#111827] text-white"
          }`}
        >
          {destination}
        </span>
      </div>
    </div>
  );
}

// =========================================================
// DATA HELPERS
// =========================================================

function prepareCompetitions(
  stages: StageRow[]
): CompetitionBracketData[] {
  const competitionMap =
    new Map<
      string,
      CompetitionBracketData
    >();

  for (const stage of stages) {
    const competition =
      stage.competitions;

    if (!competition?.id) {
      continue;
    }

    const preparedRounds =
      (stage.tournament_rounds ?? [])
        .sort(
          (a, b) =>
            (a.sequence_number ?? 0) -
            (b.sequence_number ?? 0)
        )
        .map(
          (round): PreparedRound => {
            const matches =
              (round.matches ?? [])
                .filter(
                  (match) =>
                    match.is_published ===
                    true
                )
                .sort(
                  (a, b) =>
                    (a.match_number ??
                      Number.MAX_SAFE_INTEGER) -
                    (b.match_number ??
                      Number.MAX_SAFE_INTEGER)
                )
                .map(
                  (
                    match
                  ): PreparedMatch => {
                    const officialResult =
                      getOfficialResult(
                        match.match_results
                      );

                    const currentSchedule =
                      getCurrentPublishedSchedule(
                        match.match_schedules
                      );

                    return {
                      ...match,
                      officialResult,
                      currentSchedule,
                    };
                  }
                );

            return {
              ...round,
              stageName:
                stage.name,
              matches,
            };
          }
        )
        .filter(
          (round) =>
            round.matches.length > 0
        );

    if (
      preparedRounds.length === 0
    ) {
      continue;
    }

    const existing =
      competitionMap.get(
        competition.id
      );

    if (existing) {
      existing.rounds.push(
        ...preparedRounds
      );
    } else {
      competitionMap.set(
        competition.id,
        {
          id: competition.id,
          name:
            competition.name ??
            "Competition",
          sportName:
            competition.sports
              ?.name ?? "Sport",
          status:
            competition.status,
          rounds:
            preparedRounds,
        }
      );
    }
  }

  return Array.from(
    competitionMap.values()
  ).map((competition) => ({
    ...competition,
    rounds:
      competition.rounds.sort(
        (a, b) =>
          (a.sequence_number ?? 0) -
          (b.sequence_number ?? 0)
      ),
  }));
}

function getOfficialResult(
  results:
    | ResultRow[]
    | null
    | undefined
) {
  return (
    (results ?? [])
      .filter(
        (result) =>
          result.result_status ===
            "official" &&
          result.is_published ===
            true
      )
      .sort((a, b) => {
        const aTime =
          a.official_at
            ? new Date(
                a.official_at
              ).getTime()
            : 0;

        const bTime =
          b.official_at
            ? new Date(
                b.official_at
              ).getTime()
            : 0;

        return bTime - aTime;
      })[0] ?? null
  );
}

function getCurrentPublishedSchedule(
  schedules:
    | ScheduleRow[]
    | null
    | undefined
) {
  return (
    (schedules ?? [])
      .filter(
        (schedule) =>
          schedule.is_current ===
            true &&
          schedule.is_published ===
            true &&
          [
            "confirmed",
            "postponed",
          ].includes(
            schedule.schedule_status
          )
      )
      .sort(
        (a, b) =>
          new Date(
            a.scheduled_start
          ).getTime() -
          new Date(
            b.scheduled_start
          ).getTime()
      )[0] ?? null
  );
}

function getWinningParticipant(
  match: PreparedMatch
): ParticipantRow | null {
  const winnerId =
    match.officialResult
      ?.winner_participant_id;

  if (!winnerId) {
    return null;
  }

  if (
    match.home?.id === winnerId
  ) {
    return match.home;
  }

  if (
    match.away?.id === winnerId
  ) {
    return match.away;
  }

  return null;
}

// =========================================================
// DATE FORMAT
// =========================================================

function formatMatchDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      timeZone:
        "Asia/Kuala_Lumpur",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  ).format(
    new Date(value)
  );
}
