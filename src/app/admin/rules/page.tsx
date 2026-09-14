import { BookOpen, Eye, EyeOff, Trash2 } from "lucide-react";

import { StaffPageHeader } from "@/components/staff/staff-page-header";
import { StaffPanel } from "@/components/staff/staff-panel";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { createRule, deleteRule, toggleRulePublication } from "./actions";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-slate-400 focus:border-[#E30613] focus:ring-4 focus:ring-red-50";

export default async function AdminRulesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [editionsResult, sportsResult, competitionsResult, rulesResult] =
    await Promise.all([
      supabase
        .from("games_editions")
        .select("id,name,year,is_active")
        .order("year", { ascending: false }),
      supabase
        .from("sports")
        .select("id,name,games_edition_id")
        .order("name"),
      supabase
        .from("competitions")
        .select("id,name,sport_id")
        .order("name"),
      supabase
        .from("competition_rules")
        .select(`
          id,
          title,
          content,
          sort_order,
          is_published,
          published_at,
          created_at,
          games_editions (id,name),
          sports (id,name),
          competitions (id,name)
        `)
        .order("sort_order")
        .order("created_at", { ascending: false }),
    ]);

  if (editionsResult.error) throw new Error(editionsResult.error.message);
  if (sportsResult.error) throw new Error(sportsResult.error.message);
  if (competitionsResult.error) throw new Error(competitionsResult.error.message);
  if (rulesResult.error) throw new Error(rulesResult.error.message);

  const editions = editionsResult.data ?? [];
  const sports = sportsResult.data ?? [];
  const competitions = competitionsResult.data ?? [];
  const rules = rulesResult.data ?? [];
  const activeEdition = editions.find((edition: any) => edition.is_active);

  return (
    <div className="space-y-6">
      <StaffPageHeader
        eyebrow="Public Information"
        title="Competition Rules"
        description="Create and publish official competition information for the public. Rules can be scoped to an edition, sport, or specific competition."
      />

      <StaffPanel
        title="Add Rule"
        description="Draft rules stay private until you publish them."
      >
        <form action={createRule} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Games Edition</span>
            <select name="games_edition_id" required defaultValue={activeEdition?.id ?? editions[0]?.id ?? ""} className={inputClass}>
              <option value="">Select edition</option>
              {editions.map((edition: any) => (
                <option key={edition.id} value={edition.id}>{edition.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Sport (Optional)</span>
            <select name="sport_id" defaultValue="" className={inputClass}>
              <option value="">All sports</option>
              {sports.map((sport: any) => (
                <option key={sport.id} value={sport.id}>{sport.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Competition (Optional)</span>
            <select name="competition_id" defaultValue="" className={inputClass}>
              <option value="">All competitions</option>
              {competitions.map((competition: any) => (
                <option key={competition.id} value={competition.id}>{competition.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Sort Order</span>
            <input name="sort_order" type="number" defaultValue="0" className={inputClass} />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Title</span>
            <input name="title" required placeholder="e.g. Match Duration" className={inputClass} />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Rule / Information</span>
            <textarea name="content" required rows={6} placeholder="Enter the approved competition rule or public information..." className={inputClass} />
          </label>

          <div className="flex flex-col gap-4 lg:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input name="is_published" type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-[#E30613]" />
              Publish immediately
            </label>
            <button type="submit" className="rounded-xl bg-[#E30613] px-5 py-3 text-sm font-black text-white transition hover:bg-[#B0000C]">
              Save Rule
            </button>
          </div>
        </form>
      </StaffPanel>

      <StaffPanel title="Rules Library" description={`${rules.length} rule${rules.length === 1 ? "" : "s"} configured.`}>
        {rules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500">No rules have been created yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule: any) => (
              <article key={rule.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${rule.is_published ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {rule.is_published ? "Published" : "Draft"}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">Order {rule.sort_order}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-black text-[#111827]">{rule.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{rule.content}</p>
                    <p className="mt-3 text-xs font-semibold text-slate-400">
                      {rule.games_editions?.name ?? "Edition"}
                      {rule.sports?.name ? ` · ${rule.sports.name}` : " · All sports"}
                      {rule.competitions?.name ? ` · ${rule.competitions.name}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <form action={toggleRulePublication.bind(null, rule.id)}>
                      <input type="hidden" name="publish" value={rule.is_published ? "false" : "true"} />
                      <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 transition hover:border-red-200 hover:text-[#E30613]">
                        {rule.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {rule.is_published ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <form action={deleteRule.bind(null, rule.id)}>
                      <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3.5 py-2 text-xs font-black text-red-600 transition hover:bg-red-50">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </StaffPanel>
    </div>
  );
}
