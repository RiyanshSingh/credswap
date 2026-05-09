import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  gradient?: string;
  onClick?: () => void;
  className?: string;
}

export function CategoryCard({
  icon: Icon,
  label,
  count,
  gradient = "gradient-primary",
  onClick,
  className,
}: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center p-3 sm:p-6 w-full rounded-2xl sm:rounded-3xl bg-card shadow-card border border-border/50 hover:shadow-medium hover:border-primary/20 transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      <div
        className={cn(
          "w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 transition-transform group-hover:scale-110 shadow-sm",
          gradient
        )}
      >
        <Icon className="w-5 h-5 sm:w-8 sm:h-8 text-primary-foreground" />
      </div>
      <span className="font-display font-semibold text-sm sm:text-lg text-foreground mb-0.5 sm:mb-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs sm:text-sm text-muted-foreground">{count.toLocaleString()} items</span>
      )}
    </button>
  );
}
