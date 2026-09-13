type StatusType =
  | "official"
  | "upcoming"
  | "confirmed"
  | "postponed"
  | "completed"
  | "tbd"
  | "live";

export function PublicStatusBadge({
  status,
}: {
  status: StatusType;
}) {
  const config: Record<
    StatusType,
    {
      label: string;
      className: string;
      dotClassName: string;
    }
  > = {
    official: {
      label: "Official",
      className:
        "bg-green-50 text-green-700",
      dotClassName: "bg-green-500",
    },

    upcoming: {
      label: "Upcoming",
      className:
        "bg-red-50 text-[#E30613]",
      dotClassName: "bg-[#E30613]",
    },

    confirmed: {
      label: "Confirmed",
      className:
        "bg-green-50 text-green-700",
      dotClassName: "bg-green-500",
    },

    postponed: {
      label: "Postponed",
      className:
        "bg-amber-50 text-amber-700",
      dotClassName: "bg-amber-500",
    },

    completed: {
      label: "Completed",
      className:
        "bg-slate-100 text-slate-600",
      dotClassName: "bg-slate-500",
    },

    tbd: {
      label: "TBD",
      className:
        "bg-slate-100 text-slate-500",
      dotClassName: "bg-slate-400",
    },

    live: {
      label: "Live",
      className:
        "bg-red-50 text-[#E30613]",
      dotClassName:
        "bg-[#E30613] animate-pulse",
    },
  };

  const item = config[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${item.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${item.dotClassName}`}
      />

      {item.label}
    </span>
  );
}