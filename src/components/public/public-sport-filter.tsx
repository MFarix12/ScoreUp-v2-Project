import Link from "next/link";

type SportOption = {
  id: string;
  name: string;
};

export function PublicSportFilter({
  sports,
  selectedSport,
  basePath,
}: {
  sports: SportOption[];
  selectedSport?: string | null;
  basePath: string;
}) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2">
        <Link
          href={basePath}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            !selectedSport
              ? "bg-[#E30613] text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-[#E30613]"
          }`}
        >
          All Sports
        </Link>

        {sports.map((sport) => {
          const active = selectedSport === sport.id;

          return (
            <Link
              key={sport.id}
              href={`${basePath}?sport=${encodeURIComponent(sport.id)}`}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                active
                  ? "bg-[#E30613] text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-[#E30613]"
              }`}
            >
              {sport.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
