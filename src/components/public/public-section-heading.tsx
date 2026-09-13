import Link from "next/link";

export function PublicSectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkText,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <div className="mb-3 h-1 w-10 rounded-full bg-[#E30613]" />

        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E30613]">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827] sm:text-3xl">
          {title}
        </h2>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      {href && linkText && (
        <Link
          href={href}
          className="w-fit text-sm font-bold text-[#E30613] transition hover:text-[#B0000C] hover:underline"
        >
          {linkText} →
        </Link>
      )}
    </div>
  );
}