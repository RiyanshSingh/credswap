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
        "relative bg-card rounded-2xl border border-border/50 shadow-card p-5 overflow-hidden group hover:shadow-medium hover:border-primary/20 transition-all duration-300",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 gradient-primary opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {icon && (
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
              {icon}
            </div>
          )}
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
