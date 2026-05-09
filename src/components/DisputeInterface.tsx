import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Send, ShieldAlert, XCircle, Coins, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DisputeInterfaceProps {
    disputeId: string;
    userRole: 'admin' | 'user';
}

export default function DisputeInterface({ disputeId, userRole }: DisputeInterfaceProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState("");
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        action: 'refund' | 'release' | null;
    }>({
        isOpen: false,
        title: "",
        description: "",
        action: null
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isAdmin = userRole === 'admin';

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch Session
    const { data: session } = useQuery({
        queryKey: ['session'],
        queryFn: async () => {
            const { data } = await supabase.auth.getSession();
            return data.session;
        }
    });

    // Fetch Dispute Details
    const { data: dispute, isLoading } = useQuery({
        queryKey: ['dispute', disputeId],
        enabled: !!disputeId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('marketplace_disputes')
                .select(`*, order:order_id(*, item:marketplace_items(*), buyer:buyer_id(*), seller:seller_id(*)), raised_by_profile:raised_by(*)`)
                .eq('id', disputeId)
                .single();
            if (error) throw error;
            return data;
        }
    });

    // Fetch Messages
    const { data: messages } = useQuery({
        queryKey: ['dispute-messages', disputeId],
        enabled: !!disputeId,
        queryFn: async () => {
            const table = 'dispute_messages';

            const { data, error } = await supabase
                .from(table)
                .select('*, sender:sender_id(*)')
                .eq('dispute_id', disputeId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        },
        refetchInterval: 3000 // Poll every 3 seconds for new messages
    });

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Send Message Mutation
    const sendMessage = useMutation({
        mutationFn: async () => {
            if (!newMessage.trim()) return;

            if (isAdmin) {
                const { error } = await supabase.rpc('post_admin_message', {
                    p_dispute_id: disputeId,
                    p_content: newMessage
                });
                if (error) throw error;
            } else if (session) {
                const { error } = await supabase.from('dispute_messages').insert({
                    dispute_id: disputeId,
                    sender_id: session.user.id,
                    content: newMessage,
                    is_admin_message: false
                });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            setNewMessage("");
            queryClient.invalidateQueries({ queryKey: ['dispute-messages'] });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    // Admin Resolution Mutation
    const resolveDispute = useMutation({
        mutationFn: async (resolutionType: 'refund' | 'release') => {
            const { error } = await supabase.rpc('resolve_dispute', {
                p_dispute_id: disputeId,
                p_resolution_type: resolutionType
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dispute'] });
            toast({ title: "Dispute Resolved", description: "Action completed successfully." });
        },
        onError: (err: any) => toast({ title: "Resolution Failed", description: err.message, variant: "destructive" })
    });

    if (isLoading) return <div className="p-8 text-center">Loading dispute details...</div>;
    if (!dispute) return <div className="p-8 text-center">Dispute not found.</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Col: Dispute Info & Admin Actions */}
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-destructive" />
                            Dispute #{dispute.id.slice(0, 6)}
                        </CardTitle>
                        <CardDescription>
                            Status: <Badge variant={dispute.status === 'open' ? 'destructive' : 'outline'}>{dispute.status}</Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted p-3 rounded-md text-sm">
                            <span className="font-semibold block mb-1">Reason:</span>
                            {dispute.reason}
                        </div>

                        <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Order ID:</span>
                                <span className="font-mono">{dispute.order_id?.slice(0, 8)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount:</span>
                                <span className="font-bold">₹{dispute.order?.amount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Item:</span>
                                <span>{dispute.order?.item?.title}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Seller:</span>
                                <span>{dispute.order?.seller?.full_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Buyer:</span>
                                <span>{dispute.order?.buyer?.full_name}</span>
                            </div>
                        </div>
                    </CardContent>

                    {/* Admin Actions */}
                    {isAdmin && dispute.status === 'open' && (
                        <CardFooter className="flex flex-col gap-3 pt-2">
                            <div className="text-xs text-muted-foreground w-full text-center mb-2">Admin Resolution Actions</div>

                            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setConfirmDialog({
                                isOpen: true,
                                title: "Release funds to Seller?",
                                description: "This will transfer the escrowed funds to the recipient. This action cannot be reversed.",
                                action: 'release'
                            })}>
                                <Coins className="w-4 h-4 mr-2" />
                                Release Funds to Seller
                            </Button>

                            <Button variant="destructive" className="w-full" onClick={() => setConfirmDialog({
                                isOpen: true,
                                title: "Refund Buyer?",
                                description: "This will return the escrowed funds to the payer. This action cannot be reversed.",
                                action: 'refund'
                            })}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Refund Buyer
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>

            {/* Resolution Confirmation Dialog */}
            <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
                <AlertDialogContent className="w-[90%] max-w-[380px] rounded-2xl border-border/50 shadow-large">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">{confirmDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            {confirmDialog.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl border-border/50 hover:bg-secondary">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(
                                "rounded-xl px-6",
                                confirmDialog.action === 'refund' ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-primary hover:bg-primary/90"
                            )}
                            onClick={() => {
                                if (confirmDialog.action) resolveDispute.mutate(confirmDialog.action);
                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                            }}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Right Col: Chat Interface */}
            <div className="lg:col-span-2">
                <Card className="h-[600px] flex flex-col">
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            {isAdmin ? "Admin Dispute Resolution" : "Dispute Resolution Chat"}
                        </CardTitle>
                        <CardDescription>
                            Secure communication channel between parties and admin.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10">
                        {messages?.length === 0 && (
                            <div className="text-center text-muted-foreground py-10">No messages yet. Start the conversation.</div>
                        )}
                        {messages?.map((msg: any) => {
                            // Check if message is mine
                            let isMe = false;
                            if (isAdmin) {
                                isMe = msg.is_admin_message === true;
                                // Also check sender_id for fallback if admin uses regular user system? Unlikely
                            } else {
                                isMe = msg.sender_id === session?.user?.id;
                            }

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                                        <div className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                                            <span>
                                                {msg.is_admin_message ? (
                                                    <span className="font-bold text-destructive">Admin</span>
                                                ) : (
                                                    msg.sender?.full_name || 'User'
                                                )}
                                            </span>
                                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="text-sm">{msg.content}</div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </CardContent>

                    <CardFooter className="p-4 border-t bg-card">
                        <div className="flex w-full gap-2">
                            <Textarea
                                placeholder={isAdmin ? "Type as Admin..." : "Type your message..."}
                                className="min-h-[50px] resize-none"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage.mutate();
                                    }
                                }}
                            />
                            <Button size="icon" className="h-[50px] w-[50px]" onClick={() => sendMessage.mutate()} disabled={!newMessage.trim() || sendMessage.isPending}>
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
