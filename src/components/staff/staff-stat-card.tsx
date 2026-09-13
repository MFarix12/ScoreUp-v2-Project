import type { ReactNode } from "react";

export function StaffStatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number | string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black tracking-tight text-[#111827]">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-[#E30613]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}