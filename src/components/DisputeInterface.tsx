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
    adminCredentials?: { username: string; password: string } | null;
}

export default function DisputeInterface({ disputeId, adminCredentials = null }: DisputeInterfaceProps) {
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
    const isAdmin = Boolean(adminCredentials);

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
            if (isAdmin) {
                const { data, error } = await supabase.rpc('admin_get_marketplace_dispute', {
                    p_dispute_id: disputeId,
                    p_username: adminCredentials?.username,
                    p_password: adminCredentials?.password,
                });
                if (error) throw error;
                return data;
            }
            const { data, error } = await supabase
                .from('marketplace_disputes')
                .select(`*, order:order_id(*, item:marketplace_items(*), buyer:buyer_id(*), seller:seller_id(*)), raised_by_profile:raised_by(*)`)
                .eq('id', disputeId)
                .single();
            if (error) throw error;
            return data;
        }
    });

    // Fetch Chat & Messages
    const { data: chat } = useQuery({
        queryKey: ['dispute-chat', disputeId, isAdmin],
        enabled: !!disputeId && !isAdmin,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('dispute_chats')
                .select('*')
                .eq('order_id', dispute?.order_id)
                .single();
            if (error) return null;
            return data;
        }
    });

    const { data: messages } = useQuery({
        queryKey: ['dispute-messages', disputeId, chat?.id, isAdmin],
        enabled: isAdmin || !!chat?.id,
        queryFn: async () => {
            if (isAdmin) {
                const { data, error } = await supabase.rpc('admin_get_marketplace_dispute_messages', {
                    p_dispute_id: disputeId,
                    p_username: adminCredentials?.username,
                    p_password: adminCredentials?.password,
                });
                if (error) throw error;
                return Array.isArray(data) ? data : [];
            }
            const { data, error } = await supabase
                .from('dispute_messages')
                .select('*, sender:sender_id(*)')
                .eq('chat_id', chat.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        },
        refetchInterval: 3000
    });

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Send Message Mutation
    const sendMessage = useMutation({
        mutationFn: async () => {
            if (!newMessage.trim() || (!chat?.id && !isAdmin)) return;

            const { error } = isAdmin
                ? await supabase.rpc('admin_post_marketplace_dispute_message', {
                    p_dispute_id: disputeId,
                    p_content: newMessage.trim(),
                    p_username: adminCredentials?.username,
                    p_password: adminCredentials?.password,
                })
                : await supabase.rpc('post_marketplace_dispute_message', {
                    p_dispute_id: disputeId,
                    p_content: newMessage.trim(),
                });
            if (error) throw error;
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
            const { error } = await supabase.rpc('resolve_marketplace_dispute', {
                p_dispute_id: disputeId,
                p_resolution: resolutionType,
                p_notes: "Resolved via the administrative dispute interface.",
                p_username: adminCredentials?.username,
                p_password: adminCredentials?.password,
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
                <Card className="bg-[#080808] border-white/10 text-white shadow-2xl">
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
                        <div className="bg-white/[0.04] border border-white/5 p-3 rounded-xl text-sm text-zinc-300">
                            <span className="font-semibold block mb-1 text-white">Reason:</span>
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
                            <div className="text-xs text-zinc-500 w-full text-center mb-2">Admin Resolution Actions</div>

                            <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black" onClick={() => setConfirmDialog({
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
                <Card className="h-[600px] flex flex-col bg-[#080808] border-white/10 text-white shadow-2xl">
                    <CardHeader className="border-b border-white/5">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            {isAdmin ? "Admin Dispute Resolution" : "Dispute Resolution Chat"}
                        </CardTitle>
                        <CardDescription>
                            Secure communication channel between parties and admin.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
                        {messages?.length === 0 && (
                            <div className="text-center text-muted-foreground py-10">No messages yet. Start the conversation.</div>
                        )}
                        {messages?.map((msg: any) => {
                            const isMe = isAdmin ? !msg.sender_id : msg.sender_id === session?.user?.id;
                            const isSenderAdmin = msg.sender?.role === 'admin' || !msg.sender_id;

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={cn(
                                        "max-w-[80%] rounded-2xl p-4 shadow-sm",
                                        isMe ? "bg-white text-black border-white rounded-tr-none" : "bg-white/[0.04] border border-white/10 text-zinc-200 rounded-tl-none",
                                        isSenderAdmin && !isMe && "border-destructive/30 bg-destructive/5"
                                    )}>
                                        <div className="text-[10px] uppercase tracking-widest font-black opacity-50 mb-2 flex justify-between gap-6">
                                            <span className="flex items-center gap-1.5">
                                                {isSenderAdmin && <ShieldAlert className="w-3 h-3 text-destructive" />}
                                                {isSenderAdmin ? "Official Admin" : msg.sender?.full_name || 'User'}
                                            </span>
                                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="text-sm leading-relaxed">{msg.content}</div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </CardContent>

                    <CardFooter className="p-4 border-t border-white/5 bg-white/[0.02]">
                        <div className="flex w-full gap-2">
                            <Textarea
                                placeholder={isAdmin ? "Type as Admin..." : "Type your message..."}
                                className="min-h-[50px] resize-none bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage.mutate();
                                    }
                                }}
                            />
                            <Button size="icon" className="h-[50px] w-[50px] bg-white text-black hover:bg-zinc-200" onClick={() => sendMessage.mutate()} disabled={!newMessage.trim() || sendMessage.isPending}>
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
