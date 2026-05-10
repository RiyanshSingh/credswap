import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
    className?: string;
    showText?: boolean;
}

export function VerifiedBadge({ className, showText = false }: VerifiedBadgeProps) {
    return (
        <div className={cn("inline-flex items-center gap-1", className)} title="Verified Student">
            <CheckCircle2 className="w-4 h-4 text-white fill-blue-500 drop-shadow-md" />
            {showText && <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Verified</span>}
        </div>
    );
}
