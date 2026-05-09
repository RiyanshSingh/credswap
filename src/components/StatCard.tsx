import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  className,
}: StatCardProps) {
  const changeColors = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "relative bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 overflow-hidden group hover:border-white/20 transition-all duration-300",
        className
      )}
    >
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none z-0" />
      <div className="relative z-20">
        <div className="flex flex-col gap-4 mb-4">
          {icon && (
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-transform group-hover:scale-105">
              {icon}
            </div>
          )}
          <span className="text-sm font-medium text-zinc-400">{label}</span>
        </div>

        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between md:gap-0">
          <span className="text-2xl md:text-3xl font-display font-bold text-foreground break-words leading-none">
            {value}
          </span>
          {change && (
            <span className={cn("text-xs md:text-sm font-medium", changeColors[changeType])}>
              {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
