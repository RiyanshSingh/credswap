import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface BetterProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  gradient?: boolean;
}

const BetterProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  BetterProgressProps
>(({ className, value, gradient, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all duration-1000 ease-in-out",
        gradient 
          ? "bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600 bg-[length:200%_auto] animate-gradient" 
          : "bg-indigo-600"
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
BetterProgress.displayName = ProgressPrimitive.Root.displayName;

export { BetterProgress };
