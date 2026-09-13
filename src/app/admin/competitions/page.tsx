import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function CompetitionsPage() {
  const supabase = await createClient();

  const {
    data: competitions,
    error,
  } = await supabase
    .from("competitions")
    .select(`
      id,
      name,
      code,
      category,
      competition_type,
      is_medal_event,
      status,

      sports (
        id,
        name,
        code,

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
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-8">
      {/* ========================================
          PAGE HEADER
      ======================================== */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-3 h-1 w-12 rounded-full bg-[#E30613]" />

          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Competitions
          </h1>

          <p className="mt-2 text-slate-500">
            Manage competition events, tournament formats and scheduling
            rules.
          </p>
        </div>

        <Link
          href="/admin/competitions/new"
          className="rounded-xl bg-[#E30613] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#B0000C]"
        >
          + New Competition
        </Link>
      </div>

      {/* ========================================
          COMPETITION TABLE
      ======================================== */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-[#E30613]" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Competition
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Sport
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Format
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Type
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Medal
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Status
                </th>

                <th className="px-6 py-4 font-semibold text-[#111827]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {competitions?.map((competition) => (
                <tr
                  key={competition.id}
                  className="transition hover:bg-red-50/30"
                >
                  {/* Competition */}
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#111827]">
                      {competition.name}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>
                        {competition.code}
                      </span>

                      {competition.category && (
                        <>
                          <span className="text-slate-300">
                            •
                          </span>

                          <span>
                            {competition.category}
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Sport */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-700">
                      {competition.sports?.name ?? "-"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {competition.sports?.games_editions?.name ?? ""}
                    </p>
                  </td>

                  {/* Format */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-700">
                      {competition.tournament_formats?.name ?? "-"}
                    </p>
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {competition.competition_type}
                    </span>
                  </td>

                  {/* Medal */}
                  <td className="px-6 py-4">
                    {competition.is_medal_event ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        Medal
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">
                        No
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <CompetitionStatus
                      status={competition.status}
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <Link
                        href={`/admin/competitions/${competition.id}/edit`}
                        className="font-semibold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
                      >
                        Edit
                      </Link>

                      <Link
                        href={`/admin/competitions/${competition.id}/scheduling`}
                        className="font-semibold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
                      >
                        Scheduling
                      </Link>

                      <Link
                        href={`/admin/tournaments/${competition.id}`}
                        className="font-semibold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
                      >
                        Tournament
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {competitions?.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center"
                  >
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 font-bold text-[#E30613]">
                        C
                      </div>

                      <p className="mt-4 font-semibold text-[#111827]">
                        No competitions created yet
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Create a competition before setting up participants,
                        tournament structure and scheduling.
                      </p>

                      <Link
                        href="/admin/competitions/new"
                        className="mt-5 inline-block rounded-xl bg-[#E30613] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B0000C]"
                      >
                        Create Competition
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================
          INFORMATION
      ======================================== */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-[#111827]">
            Tournament Setup
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use the <strong>Tournament</strong> action to assign seeds,
            generate tournament rounds and view the competition bracket.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-[#111827]">
            Scheduling Rules
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use the <strong>Scheduling</strong> action to configure default
            match duration, minimum participant rest time and same-day match
            restrictions.
          </p>
        </div>
      </div>
    </div>
  );
}

function CompetitionStatus({
  status,
}: {
  status: string;
}) {
  const label =
    status.replaceAll("_", " ");

  if (status === "completed") {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold capitalize text-green-700">
        {label}
      </span>
    );
  }

  if (status === "in_progress") {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold capitalize text-[#E30613]">
        {label}
      </span>
    );
  }

  if (status === "scheduled") {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-700">
        {label}
      </span>
    );
  }

  if (status === "archived") {
    return (
      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
        {label}
      </span>
    );
  }

  if (status === "setup") {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold capitalize text-[#B0000C]">
        {label}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
      {label}
    </span>
  );
}