import { BookOpen, Trophy } from "lucide-react";

import { PublicPageHeader } from "@/components/public/public-page-header";
import { createClient } from "@/lib/supabase/server";

export default async function PublicRulesPage() {
  const supabase = await createClient();

  const editionResult = await supabase
    .from("games_editions")
    .select("id,name")
    .eq("is_public", true)
    .eq("is_active", true)
    .maybeSingle();

  if (editionResult.error) throw new Error(editionResult.error.message);

  const edition = editionResult.data;
  let rules: any[] = [];

  if (edition?.id) {
    const rulesResult = await supabase
      .from("competition_rules")
      .select(`
        id,
        title,
        content,
        sort_order,
        published_at,
        sports (id,name),
        competitions (id,name)
      `)
      .eq("games_edition_id", edition.id)
      .eq("is_published", true)
      .order("sort_order")
      .order("created_at", { ascending: true });

    if (rulesResult.error) throw new Error(rulesResult.error.message);
    rules = rulesResult.data ?? [];
  }

  return (
    <>
      <PublicPageHeader
        eyebrow="Official Information"
        title="Competition Rules"
        description={`Published rules and competition information for ${edition?.name ?? "the current SuperUPSI Games"}.`}
      />

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        {rules.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-xl font-black text-[#111827]">No published rules yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Official competition rules will appear here once published by the administrator.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {rules.map((rule, index) => (
              <article key={rule.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="flex gap-4 p-6 sm:p-7">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-sm font-black text-[#E30613]">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5" />
                        {rule.sports?.name ?? "General"}
                      </span>
                      {rule.competitions?.name && (
                        <>
                          <span>•</span>
                          <span>{rule.competitions.name}</span>
                        </>
                      )}
                    </div>
                    <h2 className="mt-2 text-xl font-black text-[#111827]">{rule.title}</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{rule.content}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
