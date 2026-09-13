type TeamLogoProps = {
  name: string;
  code?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

function getInitials(name: string, code?: string | null) {
  if (code?.trim()) {
    return code.trim().slice(0, 3).toUpperCase();
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function TeamLogo({
  name,
  code,
  size = "md",
  className = "",
}: TeamLogoProps) {
  const sizeClass = {
    sm: "h-9 w-9 rounded-xl text-[10px]",
    md: "h-12 w-12 rounded-2xl text-xs",
    lg: "h-16 w-16 rounded-[20px] text-sm",
  }[size];

  return (
    <div
      aria-label={`${name} logo`}
      title={name}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-red-100 bg-gradient-to-br from-red-50 to-white font-black tracking-tight text-[#E30613] shadow-sm ${sizeClass} ${className}`}
    >
      <span className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-[#E30613]/10" />
      <span className="relative">{getInitials(name, code)}</span>
    </div>
  );
}
