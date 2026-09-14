import {
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";

type RoleRow = {
  id: string;
  user_profile_id: string;
  role_id: string;
  games_edition_id: string | null;
};

type TechnicianAssignmentRow = {
  id: string;
  user_profile_id: string;
  games_edition_id: string;
  sport_id: string | null;
  competition_id: string | null;
  can_enter_results: boolean;
  can_submit_results: boolean;
  can_manage_schedule: boolean;
  status: string;
};

export default async function AdminUsersPage() {
  await requireAdmin();

  const supabase = await createClient();

  const [
    profilesResult,
    rolesResult,
    userRolesResult,
    assignmentsResult,
    editionsResult,
    sportsResult,
    competitionsResult,
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("id, full_name, email, status, created_at")
      .order("full_name", { ascending: true }),

    supabase
      .from("roles")
      .select("id, name, code")
      .order("name", { ascending: true }),

    supabase
      .from("user_roles")
      .select("id, user_profile_id, role_id, games_edition_id"),

    supabase
      .from("technician_assignments")
      .select(`
        id,
        user_profile_id,
        games_edition_id,
        sport_id,
        competition_id,
        can_enter_results,
        can_submit_results,
        can_manage_schedule,
        status
      `),

    supabase
      .from("games_editions")
      .select("id, name, year"),

    supabase
      .from("sports")
      .select("id, name"),

    supabase
      .from("competitions")
      .select("id, name"),
  ]);

  const firstError = [
    profilesResult.error,
    rolesResult.error,
    userRolesResult.error,
    assignmentsResult.error,
    editionsResult.error,
    sportsResult.error,
    competitionsResult.error,
  ].find(Boolean);

  if (firstError) {
    throw new Error(
      "ScoreUp could not load user and assignment information."
    );
  }

  const profiles = profilesResult.data ?? [];
  const roles = rolesResult.data ?? [];
  const userRoles = (userRolesResult.data ?? []) as RoleRow[];
  const assignments = (assignmentsResult.data ?? []) as TechnicianAssignmentRow[];

  const roleById = new Map(
    roles.map((role) => [role.id, role])
  );

  const editionById = new Map(
    (editionsResult.data ?? []).map((edition) => [
      edition.id,
      `${edition.name}${edition.year ? ` (${edition.year})` : ""}`,
    ])
  );

  const sportById = new Map(
    (sportsResult.data ?? []).map((sport) => [
      sport.id,
      sport.name,
    ])
  );

  const competitionById = new Map(
    (competitionsResult.data ?? []).map((competition) => [
      competition.id,
      competition.name,
    ])
  );

  const administratorRoleIds = new Set(
    roles
      .filter((role) => role.code === "admin")
      .map((role) => role.id)
  );

  const technicianRoleIds = new Set(
    roles
      .filter((role) => role.code === "technician")
      .map((role) => role.id)
  );

  const adminCount = new Set(
    userRoles
      .filter((userRole) => administratorRoleIds.has(userRole.role_id))
      .map((userRole) => userRole.user_profile_id)
  ).size;

  const technicianCount = new Set(
    userRoles
      .filter((userRole) => technicianRoleIds.has(userRole.role_id))
      .map((userRole) => userRole.user_profile_id)
  ).size;

  const activeAssignmentCount = assignments.filter(
    (assignment) => assignment.status === "active"
  ).length;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-[#111827] text-white shadow-sm">
        <div className="relative px-6 py-7 sm:px-8 sm:py-9">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#E30613]/20 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">
              Access & Assignment Management
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Users
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Review ScoreUp user accounts, application roles, and Sports Technician competition scopes.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={profiles.length}
          icon={<Users className="h-5 w-5" />}
        />

        <StatCard
          label="Administrators"
          value={adminCount}
          icon={<ShieldCheck className="h-5 w-5" />}
        />

        <StatCard
          label="Technicians"
          value={technicianCount}
          icon={<UserCheck className="h-5 w-5" />}
        />

        <StatCard
          label="Active Assignments"
          value={activeAssignmentCount}
          icon={<Wrench className="h-5 w-5" />}
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-black text-[#111827]">
            User Directory
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Application roles and technician scopes currently configured in ScoreUp.
          </p>
        </div>

        {profiles.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No user profiles have been created yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {profiles.map((profile) => {
              const profileRoles = userRoles
                .filter(
                  (userRole) =>
                    userRole.user_profile_id === profile.id
                )
                .map((userRole) => ({
                  ...userRole,
                  role: roleById.get(userRole.role_id),
                }));

              const profileAssignments = assignments.filter(
                (assignment) =>
                  assignment.user_profile_id === profile.id
              );

              return (
                <article
                  key={profile.id}
                  className="p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black text-[#111827]">
                          {profile.full_name || "Unnamed User"}
                        </h3>

                        <StatusBadge status={profile.status} />
                      </div>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        {profile.email}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {profileRoles.length > 0 ? (
                          profileRoles.map((userRole) => (
                            <span
                              key={userRole.id}
                              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
                            >
                              {userRole.role?.name ?? "Unknown Role"}
                              {userRole.games_edition_id
                                ? ` · ${editionById.get(userRole.games_edition_id) ?? "Edition"}`
                                : ""}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                            No application role assigned
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full xl:max-w-xl">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Technician Scope
                      </p>

                      {profileAssignments.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-400">
                          No technician assignments.
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {profileAssignments.map((assignment) => {
                            const scope = assignment.competition_id
                              ? competitionById.get(assignment.competition_id) ?? "Competition"
                              : assignment.sport_id
                                ? sportById.get(assignment.sport_id) ?? "Sport"
                                : editionById.get(assignment.games_edition_id) ?? "Games Edition";

                            const permissions = [
                              assignment.can_enter_results ? "Enter Results" : null,
                              assignment.can_submit_results ? "Submit Results" : null,
                              assignment.can_manage_schedule ? "Manage Schedule" : null,
                            ].filter(Boolean);

                            return (
                              <div
                                key={assignment.id}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-bold text-[#111827]">
                                    {scope}
                                  </p>
                                  <StatusBadge status={assignment.status} />
                                </div>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {permissions.length > 0
                                    ? permissions.join(" · ")
                                    : "View-only assignment"}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
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

function StatusBadge({
  status,
}: {
  status: string | null;
}) {
  const normalized = status?.toLowerCase() ?? "unknown";

  if (normalized === "active") {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
        Active
      </span>
    );
  }

  if (normalized === "inactive" || normalized === "suspended") {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
        {normalized === "suspended" ? "Suspended" : "Inactive"}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-600">
      {normalized.replaceAll("_", " ")}
    </span>
  );
}
