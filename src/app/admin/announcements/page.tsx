import { AlertTriangle, Eye, EyeOff, Megaphone, Trash2 } from "lucide-react";

import { StaffPageHeader } from "@/components/staff/staff-page-header";
import { StaffPanel } from "@/components/staff/staff-panel";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import {
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementPublication,
} from "./actions";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-slate-400 focus:border-[#E30613] focus:ring-4 focus:ring-red-50";

function formatDate(value: string | null) {
  if (!value) return "Not set";
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

const priorityClass: Record<string, string> = {
  normal: "bg-slate-100 text-slate-600",
  important: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [editionsResult, announcementsResult] = await Promise.all([
    supabase
      .from("games_editions")
      .select("id,name,year,is_active")
      .order("year", { ascending: false }),
    supabase
      .from("announcements")
      .select(`
        id,
        title,
        body,
        priority,
        is_published,
        published_at,
        starts_at,
        expires_at,
        created_at,
        games_editions (id,name)
      `)
      .order("created_at", { ascending: false }),
  ]);

  if (editionsResult.error) throw new Error(editionsResult.error.message);
  if (announcementsResult.error) throw new Error(announcementsResult.error.message);

  const editions = editionsResult.data ?? [];
  const announcements = announcementsResult.data ?? [];
  const activeEdition = editions.find((edition: any) => edition.is_active);

  return (
    <div className="space-y-6">
      <StaffPageHeader
        eyebrow="Public Information"
        title="Announcements"
        description="Publish event notices, schedule advisories, venue updates and other official information to public users."
      />

      <StaffPanel title="Create Announcement" description="Use priority carefully so urgent messages remain meaningful.">
        <form action={createAnnouncement} className="grid gap-4 lg:grid-cols-2">
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
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Priority</span>
            <select name="priority" defaultValue="normal" className={inputClass}>
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Title</span>
            <input name="title" required placeholder="e.g. Football venue changed" className={inputClass} />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Message</span>
            <textarea name="body" required rows={5} placeholder="Write the official announcement..." className={inputClass} />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Display From (Optional)</span>
            <input name="starts_at" type="datetime-local" className={inputClass} />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Expire At (Optional)</span>
            <input name="expires_at" type="datetime-local" className={inputClass} />
          </label>

          <div className="flex flex-col gap-4 lg:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input name="is_published" type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-[#E30613]" />
              Publish immediately
            </label>
            <button type="submit" className="rounded-xl bg-[#E30613] px-5 py-3 text-sm font-black text-white transition hover:bg-[#B0000C]">
              Save Announcement
            </button>
          </div>
        </form>
      </StaffPanel>

      <StaffPanel title="Announcement History" description={`${announcements.length} announcement${announcements.length === 1 ? "" : "s"} configured.`}>
        {announcements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <Megaphone className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500">No announcements have been created yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement: any) => (
              <article key={announcement.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${priorityClass[announcement.priority] ?? priorityClass.normal}`}>
                        {announcement.priority}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${announcement.is_published ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {announcement.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <h3 className="mt-3 flex items-center gap-2 text-lg font-black text-[#111827]">
                      {announcement.priority === "urgent" && <AlertTriangle className="h-5 w-5 text-red-600" />}
                      {announcement.title}
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{announcement.body}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-400">
                      <span>{announcement.games_editions?.name ?? "Edition"}</span>
                      <span>Starts: {formatDate(announcement.starts_at)}</span>
                      <span>Expires: {formatDate(announcement.expires_at)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <form action={toggleAnnouncementPublication.bind(null, announcement.id)}>
                      <input type="hidden" name="publish" value={announcement.is_published ? "false" : "true"} />
                      <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 transition hover:border-red-200 hover:text-[#E30613]">
                        {announcement.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {announcement.is_published ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <form action={deleteAnnouncement.bind(null, announcement.id)}>
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
