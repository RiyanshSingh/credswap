import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload, FileCheck, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface VerificationDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    currentStatus: string;
    rejectionFeedback?: string;
}

export function VerificationDialog({ isOpen, onOpenChange, userId, currentStatus, rejectionFeedback }: VerificationDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Document must be less than 5MB.",
                    variant: "destructive"
                });
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;

        try {
            setIsLoading(true);
            
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('verification-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('verification-documents').getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    verification_status: 'pending',
                    verification_document_url: publicUrl,
                    verification_feedback: null // Clear old feedback on retry
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            toast({
                title: "Application Submitted",
                description: "Our team will review your document and verify your account soon.",
            });
            
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#050505] border border-white/10 rounded-3xl max-w-md p-8">
                <DialogHeader className="text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 text-white">
                        <FileCheck className="w-8 h-8" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-white">Student Verification</DialogTitle>
                    <DialogDescription className="text-zinc-500 pt-2">
                        Upload a recent document (ID card, fee receipt, or mark sheet from the last 3 months) to verify your student status.
                    </DialogDescription>
                </DialogHeader>

                {currentStatus === 'rejected' && (
                    <div className="mt-4 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-1">Previous Application Rejected</p>
                            <p className="text-sm text-zinc-300 leading-relaxed">{rejectionFeedback || "No specific feedback provided."}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6 py-6">
                    <div className="space-y-2">
                        <Label htmlFor="doc" className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Upload Document</Label>
                        <div className="relative group cursor-pointer">
                            <Input
                                id="doc"
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*,.pdf"
                                className="hidden"
                            />
                            <div 
                                onClick={() => document.getElementById('doc')?.click()}
                                className="h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-white/20 hover:bg-white/[0.02] transition-all group-hover:scale-[0.99]"
                            >
                                <Upload className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
                                <p className="text-sm text-zinc-500 group-hover:text-zinc-300">
                                    {file ? file.name : "Click to select or drag & drop"}
                                </p>
                                <p className="text-[10px] text-zinc-600">JPG, PNG, or PDF (max 5MB)</p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={!file || isLoading}
                        className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[11px] hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit for Verification"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
