export function PublicLoading({
  title = "Loading ScoreUp",
  description = "Preparing the latest competition information...",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-5 py-16">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E30613] shadow-lg shadow-red-100">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>

        <h2 className="mt-5 text-xl font-black text-[#111827]">
          {title}
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}