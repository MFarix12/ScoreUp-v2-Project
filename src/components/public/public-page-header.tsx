export function PublicPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border-[42px] border-red-50" />
      <div className="pointer-events-none absolute right-[18%] top-10 h-24 w-24 rotate-12 rounded-[28px] bg-slate-50" />

      <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="h-1 w-12 rounded-full bg-[#E30613]" />
        <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-[#E30613]">
          {eyebrow}
        </p>
        <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight text-[#111827] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
          {description}
        </p>
      </div>
    </section>
  );
}
