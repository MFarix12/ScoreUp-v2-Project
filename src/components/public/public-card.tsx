import type { ReactNode } from "react";

export function PublicCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}