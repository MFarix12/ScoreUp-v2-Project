"use client";

import {
  useActionState,
  useState,
} from "react";

import type {
  CorrectionActionState,
} from "@/app/admin/results/[id]/correct/actions";

type Participant = {
  id: string;
  name: string;
};

type ResultCorrectionFormProps = {
  resultId: string;

  currentHomeScore:
    number | null;

  currentAwayScore:
    number | null;

  home: Participant;
  away: Participant;

  allowsDraw: boolean;

  action: (
    resultId: string,
    previousState: CorrectionActionState,
    formData: FormData
  ) => Promise<CorrectionActionState>;
};

const initialState:
  CorrectionActionState = {
    success: false,
    message: "",
  };

export function ResultCorrectionForm({
  resultId,
  currentHomeScore,
  currentAwayScore,
  home,
  away,
  allowsDraw,
  action,
}: ResultCorrectionFormProps) {
  const boundAction =
    action.bind(
      null,
      resultId
    );

  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    boundAction,
    initialState
  );

  const [
    homeScore,
    setHomeScore,
  ] = useState(
    String(
      currentHomeScore ?? 0
    )
  );

  const [
    awayScore,
    setAwayScore,
  ] = useState(
    String(
      currentAwayScore ?? 0
    )
  );

  const numericHome =
    Number(homeScore);

  const numericAway =
    Number(awayScore);

  const tied =
    Number.isFinite(
      numericHome
    ) &&
    Number.isFinite(
      numericAway
    ) &&
    numericHome ===
      numericAway;

  const tiedKnockout =
    tied &&
    !allowsDraw;

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      {/* SCORE */}
      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#E30613]">
          Corrected Score
        </p>

        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <div>
            <label
              htmlFor="home_score"
              className="mb-2 block text-sm font-bold text-[#111827]"
            >
              {home.name}
            </label>

            <input
              id="home_score"
              name="home_score"
              type="number"
              min="0"
              step="1"
              required
              value={homeScore}
              onChange={(event) =>
                setHomeScore(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-black text-[#111827] outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="hidden pb-3 text-sm font-black text-slate-400 md:block">
            VS
          </div>

          <div>
            <label
              htmlFor="away_score"
              className="mb-2 block text-sm font-bold text-[#111827]"
            >
              {away.name}
            </label>

            <input
              id="away_score"
              name="away_score"
              type="number"
              min="0"
              step="1"
              required
              value={awayScore}
              onChange={(event) =>
                setAwayScore(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-black text-[#111827] outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>
      </div>

      {/* DRAW INFO */}
      {tied &&
        allowsDraw && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="font-bold text-blue-900">
              Draw Result
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-700">
              This stage allows a
              draw. ScoreUp will
              store this result
              without a winner or
              loser.
            </p>
          </div>
        )}

      {/* TIED KNOCKOUT */}
      {tiedKnockout && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-black text-amber-900">
            Tied Knockout Score
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-700">
            Knockout matches
            cannot finish without
            a winner. Select the
            team that advanced,
            for example after a
            penalty shootout.
          </p>

          <div className="mt-4">
            <label
              htmlFor="winner_participant_id"
              className="mb-2 block text-sm font-bold text-amber-900"
            >
              Match Winner
            </label>

            <select
              id="winner_participant_id"
              name="winner_participant_id"
              required
              defaultValue=""
              className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
            >
              <option
                value=""
                disabled
              >
                Select winner
              </option>

              <option
                value={home.id}
              >
                {home.name}
              </option>

              <option
                value={away.id}
              >
                {away.name}
              </option>
            </select>
          </div>
        </div>
      )}

      {/* REASON */}
      <div>
        <label
          htmlFor="notes"
          className="mb-2 block text-sm font-bold text-[#111827]"
        >
          Correction Reason
        </label>

        <textarea
          id="notes"
          name="notes"
          required
          rows={4}
          placeholder="Explain why this official result needs to be corrected..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] placeholder:text-slate-400 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
        />

        <p className="mt-2 text-xs leading-5 text-slate-500">
          This note becomes part
          of the correction
          history. The previous
          official result is
          preserved rather than
          deleted.
        </p>
      </div>

      {/* SERVER ERROR */}
      {state.message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">
            {state.message}
          </p>
        </div>
      )}

      {/* CONFIRMATION */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#E30613]"
          />

          <span className="text-sm leading-6 text-slate-600">
            I understand that
            this will mark the
            current official
            result as{" "}
            <strong className="text-[#111827]">
              corrected
            </strong>{" "}
            and create a new
            official result.
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[#E30613] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#B0000C] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? "Correcting Result..."
          : "Confirm Result Correction"}
      </button>
    </form>
  );
}