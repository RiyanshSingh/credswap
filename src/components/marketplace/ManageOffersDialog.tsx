import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Check, X, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ManageOffersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemId: string;
    itemTitle: string;
}

export function ManageOffersDialog({
    open,
    onOpenChange,
    itemId,
    itemTitle
}: ManageOffersDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Offers
    const { data: offers, isLoading } = useQuery({
        queryKey: ['item-offers', itemId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('marketplace_offers')
                .select('*, profiles(full_name, avatar_url, email)')
                .eq('item_id', itemId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: open && !!itemId
    });

    // Update Status Mutation
    const updateStatus = useMutation({
        mutationFn: async ({ offerId, status }: { offerId: string, status: string }) => {
            const { error } = await supabase
                .from('marketplace_offers')
                .update({ status })
                .eq('id', offerId);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['item-offers', itemId] });
            toast({
                title: variables.status === 'accepted' ? "Offer Accepted" : "Offer Rejected",
                description: variables.status === 'accepted'
                    ? "The buyer has been notified and can now buy the item at this price."
                    : "The buyer has been notified of the rejection."
            });
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Offers for "{itemTitle}"</DialogTitle>
                    <DialogDescription>
                        Review and manage price offers from buyers. Accepting an offer allows that specific buyer to purchase at the offered price.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                    ) : offers?.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground bg-muted/30 rounded-lg">
                            No offers received yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {offers?.map((offer: any) => (
                                <div key={offer.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                                            {offer.profiles?.avatar_url ? (
                                                <img src={offer.profiles.avatar_url} className="w-full h-full object-cover" />
                                            ) : <User className="w-5 h-5 text-muted-foreground" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{offer.profiles?.full_name || "Unknown User"}</p>
                                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}</p>
                                        </div>
                                    </div>

                                    <div className="text-right mr-4">
                                        <div className="font-bold text-lg text-primary">₹{offer.amount}</div>
                                        <Badge variant={offer.status === 'accepted' ? 'default' : offer.status === 'rejected' ? 'destructive' : 'outline'}>
                                            {offer.status}
                                        </Badge>
                                    </div>

                                    {offer.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => updateStatus.mutate({ offerId: offer.id, status: 'rejected' })}
                                                disabled={updateStatus.isPending}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => updateStatus.mutate({ offerId: offer.id, status: 'accepted' })}
                                                disabled={updateStatus.isPending}
                                            >
                                                <Check className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
