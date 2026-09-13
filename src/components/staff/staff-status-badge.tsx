type StaffStatus =
  | "active"
  | "inactive"
  | "draft"
  | "pending"
  | "official"
  | "confirmed"
  | "postponed"
  | "completed"
  | "cancelled";

export function StaffStatusBadge({
  status,
  label,
}: {
  status: StaffStatus;
  label?: string;
}) {
  const styles: Record<StaffStatus, string> = {
    active: "bg-green-50 text-green-700",
    inactive: "bg-slate-100 text-slate-500",
    draft: "bg-slate-100 text-slate-600",
    pending: "bg-amber-50 text-amber-700",
    official: "bg-green-50 text-green-700",
    confirmed: "bg-green-50 text-green-700",
    postponed: "bg-amber-50 text-amber-700",
    completed: "bg-slate-100 text-slate-700",
    cancelled: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${styles[status]}`}
    >
      {label ?? status.replace("_", " ")}
    </span>
  );
}