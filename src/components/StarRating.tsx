
import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface StarRatingProps {
    noteId: string;
    initialRating?: number;
    readonly?: boolean;
    onRatingChange?: (newRating: number) => void;
}

export function StarRating({ noteId, initialRating = 0, readonly = false, onRatingChange }: StarRatingProps) {
    const [rating, setRating] = useState(initialRating);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
    }, []);

    const handleRate = async (value: number) => {
        if (readonly || isSubmitting) return;

        if (!session) {
            toast({
                title: "Login Required",
                description: "You must be logged in to rate notes.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        // Optimistic update
        const previousRating = rating;
        setRating(value);

        try {
            const { error } = await supabase
                .from('ratings')
                .upsert({
                    note_id: noteId,
                    user_id: session.user.id,
                    rating: value
                }, { onConflict: 'note_id,user_id' });

            if (error) throw error;

            toast({ title: "Rating Submitted", description: `You rated this note ${value} stars.` });
            if (onRatingChange) onRatingChange(value);

        } catch (error) {
            setRating(previousRating); // Revert
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to submit rating.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    disabled={readonly}
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => !readonly && setHoverRating(star)}
                    onMouseLeave={() => !readonly && setHoverRating(0)}
                    className={cn(
                        "transition-all duration-200 focus:outline-none",
                        readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
                    )}
                >
                    <Star
                        className={cn(
                            "w-5 h-5",
                            (hoverRating || rating) >= star
                                ? "fill-warning text-warning"
                                : "fill-transparent text-muted-foreground/40"
                        )}
                    />
                </button>
            ))}
            {rating > 0 && <span className="text-sm font-medium ml-2 text-foreground">{rating.toFixed(1)}</span>}
        </div>
    );
}
