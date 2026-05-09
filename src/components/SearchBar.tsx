import { cn } from "@/lib/utils";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFilter?: () => void;
  showFilter?: boolean;
  className?: string;
  onClick?: () => void;
  readOnly?: boolean;
}

export function SearchBar({
  placeholder = "Search notes, subjects, events...",
  value,
  onChange,
  onFilter,
  showFilter = true,
  className,
  onClick,
  readOnly,
}: SearchBarProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 rounded-2xl transition-all cursor-text",
        !className?.includes('bg-') && "bg-card border border-border/50 shadow-card",
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1 pl-1">
        <SearchIcon className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          className={cn(
            "flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50 text-sm font-medium py-2",
            readOnly && "cursor-pointer"
          )}
        />
      </div>
      {showFilter && (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onFilter?.();
          }}
          className="shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </Button>
      )}
    </div>
  );
}
