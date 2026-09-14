import { AlertTriangle, BellRing, Megaphone } from "lucide-react";

import { PublicPageHeader } from "@/components/public/public-page-header";
import { createClient } from "@/lib/supabase/server";

const priorityRank: Record<string, number> = {
  urgent: 0,
  important: 1,
  normal: 2,
};

const priorityStyle: Record<string, string> = {
  urgent: "border-red-200 bg-red-50 text-red-700",
  important: "border-amber-200 bg-amber-50 text-amber-700",
  normal: "border-slate-200 bg-slate-50 text-slate-600",
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export default async function PublicAnnouncementsPage() {
  const supabase = await createClient();
  const now = Date.now();

  const editionResult = await supabase
    .from("games_editions")
    .select("id,name")
    .eq("is_public", true)
    .eq("is_active", true)
    .maybeSingle();

  if (editionResult.error) throw new Error(editionResult.error.message);

  const edition = editionResult.data;
  let announcements: any[] = [];

  if (edition?.id) {
    const result = await supabase
      .from("announcements")
      .select("id,title,body,priority,published_at,starts_at,expires_at,created_at")
      .eq("games_edition_id", edition.id)
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (result.error) throw new Error(result.error.message);

    announcements = (result.data ?? [])
      .filter((item: any) => {
        const started = !item.starts_at || new Date(item.starts_at).getTime() <= now;
        const active = !item.expires_at || new Date(item.expires_at).getTime() > now;
        return started && active;
      })
      .sort(
        (a: any, b: any) =>
          (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) ||
          new Date(b.published_at ?? b.created_at).getTime() -
            new Date(a.published_at ?? a.created_at).getTime()
      );
  }

  return (
    <>
      <PublicPageHeader
        eyebrow="Latest Updates"
        title="Announcements"
        description={`Official notices and important updates for ${edition?.name ?? "the current SuperUPSI Games"}.`}
      />

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        {announcements.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <Megaphone className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-xl font-black text-[#111827]">No active announcements</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              New official notices will appear here when published.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${priorityStyle[announcement.priority] ?? priorityStyle.normal}`}>
                    {announcement.priority === "urgent" ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : announcement.priority === "important" ? (
                      <BellRing className="h-5 w-5" />
                    ) : (
                      <Megaphone className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${priorityStyle[announcement.priority] ?? priorityStyle.normal}`}>
                        {announcement.priority}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {formatDate(announcement.published_at ?? announcement.created_at)}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-black text-[#111827]">{announcement.title}</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{announcement.body}</p>
                    {announcement.expires_at && (
                      <p className="mt-4 text-xs font-semibold text-slate-400">
                        Notice valid until {formatDate(announcement.expires_at)}
                      </p>
                    )}
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
