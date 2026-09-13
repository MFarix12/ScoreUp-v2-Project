import Link from "next/link";
import type { ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "danger";

export function StaffLinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
}) {
  const styles = {
    primary:
      "bg-[#E30613] text-white hover:bg-[#B0000C]",
    secondary:
      "border border-slate-200 bg-white text-[#111827] hover:border-red-200 hover:bg-red-50 hover:text-[#E30613]",
    danger:
      "bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition ${styles[variant]}`}
    >
      {children}
    </Link>
  );
}

