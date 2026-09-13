"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export type ScheduleActionState = {
  success: boolean;
  message: string;
};

const initialError = (
  message: string
): ScheduleActionState => ({
  success: false,
  message,
});

function malaysiaDateTimeToISO(value: string) {
  if (!value) {
    throw new Error(
      "Date and time are required."
    );
  }

  return new Date(
    `${value}:00+08:00`
  ).toISOString();
}

function getMalaysiaDate(
  value: string
) {
  return value.slice(0, 10);
}

function getMalaysiaTime(
  value: string
) {
  return value.slice(11, 16);
}

function timeOverlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  return (
    startA < endB &&
    endA > startB
  );
}

function minutesBetween(
  earlier: Date,
  later: Date
) {
  return (
    later.getTime() -
    earlier.getTime()
  ) / 60000;
}

function malaysiaCalendarDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(new Date(value));
}

export async function saveMatchSchedule(
  matchId: string,
  _previousState: ScheduleActionState,
  formData: FormData
): Promise<ScheduleActionState> {
  try {
    const profile =
      await requireAdmin();

    const supabase =
      await createClient();

    // =====================================================
    // 1. FORM VALUES
    // =====================================================

    const venueId = String(
      formData.get("venue_id") ?? ""
    );

    const startValue = String(
      formData.get(
        "scheduled_start"
      ) ?? ""
    );

    const endValue = String(
      formData.get(
        "scheduled_end"
      ) ?? ""
    );

    const scheduleStatus = String(
      formData.get(
        "schedule_status"
      ) ?? "draft"
    );

    const reason = String(
      formData.get("reason") ?? ""
    ).trim();

    const isPublished =
      formData.get(
        "is_published"
      ) === "on";

    // =====================================================
    // 2. BASIC VALIDATION
    // =====================================================

    if (!venueId) {
      return initialError(
        "Please select a venue."
      );
    }

    if (
      !startValue ||
      !endValue
    ) {
      return initialError(
        "Please enter both the start and end date/time."
      );
    }

    if (
      ![
        "draft",
        "confirmed",
        "postponed",
        "cancelled",
      ].includes(scheduleStatus)
    ) {
      return initialError(
        "Invalid schedule status."
      );
    }

    if (
      isPublished &&
      scheduleStatus === "draft"
    ) {
      return initialError(
        "A draft schedule cannot be published."
      );
    }

    const scheduledStart =
      malaysiaDateTimeToISO(
        startValue
      );

    const scheduledEnd =
      malaysiaDateTimeToISO(
        endValue
      );

    if (
      new Date(scheduledStart) >=
      new Date(scheduledEnd)
    ) {
      return initialError(
        "End time must be later than the start time."
      );
    }

    // Current availability model uses
    // one calendar date per availability row.
    const startDate =
      getMalaysiaDate(
        startValue
      );

    const endDate =
      getMalaysiaDate(
        endValue
      );

    if (
      startDate !== endDate
    ) {
      return initialError(
        "A match schedule must currently start and end on the same day."
      );
    }

    const localStartTime =
      getMalaysiaTime(
        startValue
      );

    const localEndTime =
      getMalaysiaTime(
        endValue
      );

    // =====================================================
    // 3. LOAD MATCH
    // =====================================================

    const {
      data: match,
      error: matchError,
    } = await supabase
      .from("matches")
      .select(`
        id,
        match_code,
        competition_id,
        home_participant_id,
        away_participant_id,

        competitions (
          id,
          name,

          sports (
            id,
            games_edition_id
          )
        )
      `)
      .eq("id", matchId)
      .single();

    if (
      matchError ||
      !match
    ) {
      return initialError(
        "Match could not be found."
      );
    }

    const editionId =
      match.competitions
        ?.sports
        ?.games_edition_id;

    if (!editionId) {
      return initialError(
        "Unable to determine the Games Edition for this match."
      );
    }

    // =====================================================
    // 4. LOAD COMPETITION SCHEDULING RULES
    // =====================================================

    const {
      data: schedulingRules,
      error: rulesError,
    } = await supabase
      .from(
        "competition_scheduling_rules"
      )
      .select(`
        default_match_duration_minutes,
        minimum_rest_minutes,
        allow_back_to_back,
        allow_same_day_multiple_matches
      `)
      .eq(
        "competition_id",
        match.competition_id
      )
      .maybeSingle();

    if (rulesError) {
      return initialError(
        "Unable to load competition scheduling rules."
      );
    }

    const minimumRestMinutes =
      schedulingRules
        ?.minimum_rest_minutes ??
      0;

    const allowBackToBack =
      schedulingRules
        ?.allow_back_to_back ??
      false;

    const allowSameDayMultiple =
      schedulingRules
        ?.allow_same_day_multiple_matches ??
      true;

    // =====================================================
    // 5. VALIDATE VENUE
    // =====================================================

    const {
      data: venue,
      error: venueError,
    } = await supabase
      .from("venues")
      .select(`
        id,
        name,
        games_edition_id,
        status
      `)
      .eq("id", venueId)
      .single();

    if (
      venueError ||
      !venue
    ) {
      return initialError(
        "Selected venue could not be found."
      );
    }

    if (
      venue.status !== "active"
    ) {
      return initialError(
        `${venue.name} is currently inactive. Please select another venue.`
      );
    }

    if (
      venue.games_edition_id !==
      editionId
    ) {
      return initialError(
        "The selected venue belongs to a different Games Edition."
      );
    }

    // =====================================================
    // 6. CHECK VENUE AVAILABILITY
    // =====================================================

    const {
      data: availabilityRows,
      error: availabilityError,
    } = await supabase
      .from(
        "venue_availability"
      )
      .select(`
        id,
        available_date,
        start_time,
        end_time,
        availability_status,
        reason
      `)
      .eq("venue_id", venueId)
      .eq(
        "available_date",
        startDate
      );

    if (availabilityError) {
      return initialError(
        "Unable to check venue availability."
      );
    }

    const availability =
      availabilityRows ?? [];

    // Block explicit restricted periods.
    const restrictedPeriod =
      availability.find(
        (period) =>
          [
            "unavailable",
            "reserved",
            "maintenance",
          ].includes(
            period.availability_status
          ) &&
          timeOverlaps(
            localStartTime,
            localEndTime,
            period.start_time,
            period.end_time
          )
      );

    if (restrictedPeriod) {
      let statusLabel =
        restrictedPeriod.availability_status;

      if (
        restrictedPeriod.availability_status ===
        "maintenance"
      ) {
        statusLabel =
          "under maintenance";
      }

      return initialError(
        `${venue.name} is ${statusLabel} during the selected time.${
          restrictedPeriod.reason
            ? ` Reason: ${restrictedPeriod.reason}`
            : ""
        }`
      );
    }

    // If Admin configured explicit AVAILABLE
    // periods for this date, the requested match
    // must fit completely inside one of them.
    const availablePeriods =
      availability.filter(
        (period) =>
          period.availability_status ===
          "available"
      );

    if (
      availablePeriods.length > 0
    ) {
      const fitsAvailablePeriod =
        availablePeriods.some(
          (period) =>
            localStartTime >=
              period.start_time &&
            localEndTime <=
              period.end_time
        );

      if (!fitsAvailablePeriod) {
        return initialError(
          `${venue.name} is not available for the entire selected time. Please choose another time or update the venue availability.`
        );
      }
    }

    /*
     * Current behavior:
     *
     * No availability rows for the date
     * = no additional venue restriction.
     *
     * Once availability has been explicitly
     * configured, those rules are enforced.
     */

    // =====================================================
    // 7. LOAD CURRENT MATCH SCHEDULES
    // =====================================================

    const {
      data: otherSchedules,
      error: scheduleError,
    } = await supabase
      .from("match_schedules")
      .select(`
        id,
        match_id,
        venue_id,
        scheduled_start,
        scheduled_end,
        schedule_status,
        is_current,

        matches (
          id,
          match_code,
          competition_id,
          home_participant_id,
          away_participant_id
        ),

        venues (
          id,
          name
        )
      `)
      .eq("is_current", true)
      .neq("match_id", matchId)
      .in(
        "schedule_status",
        [
          "draft",
          "confirmed",
        ]
      );

    if (scheduleError) {
      return initialError(
        "Unable to check existing match schedules."
      );
    }

    const currentParticipantIds =
      [
        match.home_participant_id,
        match.away_participant_id,
      ].filter(
        (
          value
        ): value is string =>
          value !== null
      );

    // =====================================================
    // 8. VENUE OVERLAP
    // =====================================================

    const venueConflict =
      otherSchedules?.find(
        (schedule) =>
          schedule.venue_id ===
            venueId &&
          new Date(
            schedule.scheduled_start
          ) <
            new Date(
              scheduledEnd
            ) &&
          new Date(
            schedule.scheduled_end
          ) >
            new Date(
              scheduledStart
            )
      );

    if (venueConflict) {
      return initialError(
        `${venue.name} is already booked for ${
          venueConflict.matches
            ?.match_code ??
          "another match"
        } during the selected time. Please choose another venue or time.`
      );
    }

    // =====================================================
    // 9. FIND PARTICIPANT-RELATED SCHEDULES
    // =====================================================

    const participantSchedules =
      (otherSchedules ?? []).filter(
        (schedule) => {
          const otherParticipants =
            [
              schedule.matches
                ?.home_participant_id,
              schedule.matches
                ?.away_participant_id,
            ].filter(
              (
                value
              ): value is string =>
                value !== null &&
                value !== undefined
            );

          return currentParticipantIds.some(
            (participantId) =>
              otherParticipants.includes(
                participantId
              )
          );
        }
      );

    // =====================================================
    // 10. DIRECT PARTICIPANT OVERLAP
    // =====================================================

    const participantOverlap =
      participantSchedules.find(
        (schedule) =>
          new Date(
            schedule.scheduled_start
          ) <
            new Date(
              scheduledEnd
            ) &&
          new Date(
            schedule.scheduled_end
          ) >
            new Date(
              scheduledStart
            )
      );

    if (participantOverlap) {
      return initialError(
        `A participant in this match is already scheduled for ${
          participantOverlap.matches
            ?.match_code ??
          "another match"
        } during this time.`
      );
    }

    // =====================================================
    // 11. SAME-DAY RESTRICTION
    // =====================================================

    if (
      !allowSameDayMultiple
    ) {
      const sameDayMatch =
        participantSchedules.find(
          (schedule) =>
            malaysiaCalendarDate(
              schedule.scheduled_start
            ) === startDate
        );

      if (sameDayMatch) {
        return initialError(
          `A participant is already scheduled for ${
            sameDayMatch.matches
              ?.match_code ??
            "another match"
          } on ${startDate}. This competition does not allow multiple matches on the same day.`
        );
      }
    }

    // =====================================================
    // 12. REST-TIME VALIDATION
    // =====================================================

    const newStartDate =
      new Date(
        scheduledStart
      );

    const newEndDate =
      new Date(
        scheduledEnd
      );

    for (
      const schedule
      of participantSchedules
    ) {
      const otherStart =
        new Date(
          schedule.scheduled_start
        );

      const otherEnd =
        new Date(
          schedule.scheduled_end
        );

      // -----------------------------------------------
      // Existing match happens before new match.
      // -----------------------------------------------

      if (
        otherEnd <=
        newStartDate
      ) {
        const restMinutes =
          minutesBetween(
            otherEnd,
            newStartDate
          );

        if (
          restMinutes === 0 &&
          !allowBackToBack
        ) {
          return initialError(
            `A participant would have a back-to-back match immediately after ${
              schedule.matches
                ?.match_code ??
              "another match"
            }. Back-to-back matches are not allowed.`
          );
        }

        if (
          restMinutes <
          minimumRestMinutes
        ) {
          return initialError(
            `A participant only has ${Math.floor(
              restMinutes
            )} minutes of rest after ${
              schedule.matches
                ?.match_code ??
              "another match"
            }. At least ${minimumRestMinutes} minutes of rest is required.`
          );
        }
      }

      // -----------------------------------------------
      // New match happens before existing match.
      // -----------------------------------------------

      if (
        newEndDate <=
        otherStart
      ) {
        const restMinutes =
          minutesBetween(
            newEndDate,
            otherStart
          );

        if (
          restMinutes === 0 &&
          !allowBackToBack
        ) {
          return initialError(
            `This schedule would create a back-to-back match before ${
              schedule.matches
                ?.match_code ??
              "another match"
            }. Back-to-back matches are not allowed.`
          );
        }

        if (
          restMinutes <
          minimumRestMinutes
        ) {
          return initialError(
            `A participant would only have ${Math.floor(
              restMinutes
            )} minutes of rest before ${
              schedule.matches
                ?.match_code ??
              "another match"
            }. At least ${minimumRestMinutes} minutes is required.`
          );
        }
      }
    }

    // =====================================================
    // 13. ARCHIVE PREVIOUS CURRENT SCHEDULE
    // =====================================================

    const {
      error: archiveError,
    } = await supabase
      .from("match_schedules")
      .update({
        is_current: false,
      })
      .eq(
        "match_id",
        matchId
      )
      .eq(
        "is_current",
        true
      );

    if (archiveError) {
      return initialError(
        "Unable to update the previous schedule."
      );
    }

    // =====================================================
    // 14. INSERT NEW SCHEDULE VERSION
    // =====================================================

    const now =
      new Date().toISOString();

    const {
      error: insertError,
    } = await supabase
      .from("match_schedules")
      .insert({
        match_id:
          matchId,

        venue_id:
          venueId,

        scheduled_start:
          scheduledStart,

        scheduled_end:
          scheduledEnd,

        schedule_status:
          scheduleStatus,

        is_current:
          true,

        reason:
          reason || null,

        created_by:
          profile.id,

        is_published:
          isPublished,

        published_at:
          isPublished
            ? now
            : null,

        published_by:
          isPublished
            ? profile.id
            : null,
      });

    if (insertError) {
      return initialError(
        "Unable to save the schedule. Please try again."
      );
    }

    // =====================================================
    // 15. SYNCHRONIZE MATCH PUBLICATION
    // =====================================================

    const {
      error: matchPublicationError,
    } = await supabase
      .from("matches")
      .update({
        is_published:
          isPublished,

        published_at:
          isPublished
            ? now
            : null,

        published_by:
          isPublished
            ? profile.id
            : null,
      })
      .eq(
        "id",
        matchId
      );

    if (matchPublicationError) {
      return initialError(
        "The schedule was saved, but the match publication status could not be updated."
      );
    }

    // =====================================================
    // 16. REFRESH COMPETITION STATUS
    // =====================================================

    const {
      data: statusResult,
      error: statusError,
    } = await supabase.rpc(
      "refresh_competition_status",
      {
        p_competition_id:
          match.competition_id,
      }
    );

    if (statusError) {
      console.error(
        "Competition status refresh error:",
        statusError
      );

      return initialError(
        `The schedule was saved, but the competition status could not be refreshed: ${statusError.message}`
      );
    }

    console.log(
      "Competition status refreshed:",
      statusResult
    );

    // =====================================================
    // 17. REVALIDATE ADMIN
    // =====================================================

    revalidatePath(
      "/admin"
    );

    revalidatePath(
      "/admin/competitions"
    );

    revalidatePath(
      `/admin/competitions/${match.competition_id}`
    );

    revalidatePath(
      "/admin/tournaments"
    );

    revalidatePath(
      `/admin/tournaments/${match.competition_id}`
    );

    revalidatePath(
      "/admin/matches"
    );

    revalidatePath(
      `/admin/matches/${matchId}`
    );

    // =====================================================
    // 18. REVALIDATE TECHNICIAN
    // =====================================================

    revalidatePath(
      "/technician"
    );

    revalidatePath(
      "/technician/matches"
    );

    // =====================================================
    // 19. REVALIDATE PUBLIC
    // =====================================================

    revalidatePath(
      "/"
    );

    revalidatePath(
      "/schedule"
    );

    revalidatePath(
      "/fixtures"
    );

    revalidatePath(
      "/bracket"
    );

    revalidatePath(
      "/results"
    );

    revalidatePath(
      "/standings"
    );

    return {
      success: true,
      message:
        isPublished &&
        [
          "confirmed",
          "postponed",
        ].includes(
          scheduleStatus
        )
          ? "Match schedule saved and published successfully. Competition status has been refreshed."
          : "Match schedule saved successfully. No scheduling conflicts were detected.",
    };
  } catch (error) {
    console.error(
      "saveMatchSchedule error:",
      error
    );

    return {
      success: false,
      message:
        "Something went wrong while saving the schedule. Please try again.",
    };
  }
}