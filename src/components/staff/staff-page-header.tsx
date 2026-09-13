import type { ReactNode } from "react";

export function StaffPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7 lg:flex-row lg:items-end">
      <div>
        {eyebrow && (
          <>
            <div className="mb-3 h-1 w-10 rounded-full bg-[#E30613]" />

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E30613]">
              {eyebrow}
            </p>
          </>
        )}

        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#111827] sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}