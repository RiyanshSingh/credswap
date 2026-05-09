import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface MakeOfferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemId: string;
    itemTitle: string;
    currentPrice: number;
    onSuccess?: () => void;
}

export function MakeOfferDialog({
    open,
    onOpenChange,
    itemId,
    itemTitle,
    currentPrice,
    onSuccess
}: MakeOfferDialogProps) {
    const [amount, setAmount] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) {
            toast({
                title: "Invalid Amount",
                description: "pLease enter a valid offer amount.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Not logged in");

            const { error } = await supabase.from('marketplace_offers').insert({
                item_id: itemId,
                buyer_id: user.id,
                amount: Number(amount),
                status: 'pending'
            });

            if (error) throw error;

            toast({
                title: "Offer Sent!",
                description: `Your offer of ₹${amount} for "${itemTitle}" has been sent using the private offer system.`,
            });
            onOpenChange(false);
            onSuccess?.();
            setAmount('');
        } catch (err: any) {
            toast({
                title: "Failed to send offer",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Make an Offer</DialogTitle>
                    <DialogDescription>
                        Suggest a price for <span className="font-semibold text-foreground">{itemTitle}</span>.
                        The seller will be notified.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Current Price</Label>
                        <div className="font-semibold text-lg">₹{currentPrice}</div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="offer-amount">Your Offer (₹)</Label>
                        <Input
                            id="offer-amount"
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min={1}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Send Offer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
