import type { ReactNode } from "react";

interface PublicPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function PublicPageHeader({
  eyebrow = "SuperUPSI Games",
  title,
  description,
  action,
}: PublicPageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      {/* Background decoration */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-red-50/70 to-transparent" />

      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full border-[40px] border-red-50" />

      <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <div className="mb-5 h-1 w-12 rounded-full bg-[#E30613]" />

            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#E30613]">
              {eyebrow}
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#111827] sm:text-4xl lg:text-5xl">
              {title}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              {description}
            </p>
          </div>

          {action && (
            <div className="shrink-0">
              {action}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}