"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  saveMatchSchedule,
  type ScheduleActionState,
} from "@/app/admin/matches/actions";

type Venue = {
  id: string;
  name: string;
  venue_type: string;
};

type CurrentSchedule = {
  venue_id: string;
  scheduled_start: string;
  scheduled_end: string;
  schedule_status: string;
  reason: string | null;
  is_published: boolean;
} | null;

const initialState: ScheduleActionState = {
  success: false,
  message: "",
};

export function MatchScheduleForm({
  matchId,
  venues,
  currentSchedule,
}: {
  matchId: string;
  venues: Venue[];
  currentSchedule: CurrentSchedule;
}) {
  const boundAction =
    saveMatchSchedule.bind(null, matchId);

  const [state, formAction, pending] =
    useActionState(
      boundAction,
      initialState
    );

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100";

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      {state.message && (
        <div
          className={`rounded-xl border p-4 ${
            state.success
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <p className="text-sm font-semibold">
            {state.success
              ? "Schedule saved"
              : "Unable to save schedule"}
          </p>

          <p className="mt-1 text-sm">
            {state.message}
          </p>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold text-[#111827]">
          Venue
        </label>

        <select
          name="venue_id"
          required
          defaultValue={
            currentSchedule?.venue_id ?? ""
          }
          className={inputClass}
        >
          <option value="">
            Select venue
          </option>

          {venues.map((venue) => (
            <option
              key={venue.id}
              value={venue.id}
            >
              {venue.name} — {venue.venue_type}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            Start Date & Time
          </label>

          <input
            type="datetime-local"
            name="scheduled_start"
            required
            defaultValue={
              currentSchedule
                ? toMalaysiaLocalInput(
                    currentSchedule.scheduled_start
                  )
                : ""
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#111827]">
            End Date & Time
          </label>

          <input
            type="datetime-local"
            name="scheduled_end"
            required
            defaultValue={
              currentSchedule
                ? toMalaysiaLocalInput(
                    currentSchedule.scheduled_end
                  )
                : ""
            }
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-[#111827]">
          Schedule Status
        </label>

        <select
          name="schedule_status"
          defaultValue={
            currentSchedule
              ?.schedule_status ?? "draft"
          }
          className={inputClass}
        >
          <option value="draft">
            Draft
          </option>

          <option value="confirmed">
            Confirmed
          </option>

          <option value="postponed">
            Postponed
          </option>

          <option value="cancelled">
            Cancelled
          </option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-[#111827]">
          Reason / Notes
        </label>

        <textarea
          name="reason"
          rows={3}
          defaultValue={
            currentSchedule?.reason ?? ""
          }
          placeholder="Optional scheduling notes..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-[#F5F6F8] p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={
              currentSchedule
                ?.is_published ?? false
            }
            className="mt-1 h-4 w-4 accent-[#E30613]"
          />

          <div>
            <p className="text-sm font-semibold text-[#111827]">
              Publish Schedule
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Make this schedule visible on the
              public ScoreUp portal.
            </p>
          </div>
        </label>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Conflict Protection
        </p>

        <p className="mt-1 text-xs leading-5 text-amber-800">
          ScoreUp checks for venue and participant
          scheduling conflicts automatically.
        </p>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
        <Link
          href="/admin/matches"
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-[#111827] hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#E30613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B0000C] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Checking Schedule..."
            : "Save Schedule"}
        </button>
      </div>
    </form>
  );
}

function toMalaysiaLocalInput(
  value: string
) {
  const date = new Date(value);

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Kuala_Lumpur",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }
    ).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [
      part.type,
      part.value,
    ])
  );

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}