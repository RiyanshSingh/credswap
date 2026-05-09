import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface ReportFormValues {
    title: string;
    description: string;
    type: string;
    category: string;
    date: string;
    location: string;
    contact: string;
}

export function ReportItemDialog({ onSuccess, isAuthenticated, trigger }: { onSuccess: () => void, isAuthenticated: boolean, trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ReportFormValues>({
        defaultValues: {
            type: 'lost',
            category: 'Other'
        }
    });

    const itemType = watch('type');
    const [imageFile, setImageFile] = useState<File | null>(null);

    const onSubmit = async (data: any) => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast({
                    title: "Authentication required",
                    description: "Please sign in to report an item.",
                    variant: "destructive",
                });
                return;
            }

            let imageUrl = null;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('lost_found_images')
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('lost_found_images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            const { error } = await supabase
                .from('lost_found_items')
                .insert({
                    title: data.title,
                    description: data.description,
                    type: data.type || 'lost',
                    category: data.category || 'Other',
                    date_lost_found: data.date,
                    location: data.location,
                    contact_info: data.contact,
                    image_url: imageUrl,
                    user_id: user.id,
                    status: 'open'
                });

            if (error) throw error;

            toast({
                title: "Report Submitted",
                description: "Your item has been listed successfully.",
            });

            reset();
            setImageFile(null);
            setOpen(false);
            onSuccess();

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit report",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button className="gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/50 transition-all">
                            <Plus className="w-4 h-4" />
                            Report Item
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="max-w-sm text-center p-8">
                    <DialogHeader>
                        <DialogTitle className="text-xl mb-2">Sign in to Report</DialogTitle>
                        <DialogDescription>
                            You need to be signed in to report a lost or found item. This helps us ensure the safety of our community.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-4">
                        <Link to="/auth" onClick={() => setOpen(false)}>
                            <Button className="w-full gap-2">
                                Sign In / Sign Up
                            </Button>
                        </Link>
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/50 transition-all">
                        <Plus className="w-4 h-4" />
                        Report Item
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Report Lost/Found Item</DialogTitle>
                    <DialogDescription>
                        Provide details about the item to help connect with its owner.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    <div className="space-y-3">
                        <Label className="text-zinc-500 dark:text-zinc-400 font-medium">What happened?</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setValue('type', 'lost')}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all duration-200",
                                    itemType === 'lost'
                                        ? "bg-red-50/50 dark:bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 shadow-sm"
                                        : "bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                                )}
                            >
                                <AlertCircle className={cn("w-4 h-4", itemType === 'lost' ? "animate-pulse" : "")} />
                                <span className="font-semibold text-sm">I Lost It</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setValue('type', 'found')}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all duration-200",
                                    itemType === 'found'
                                        ? "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                        : "bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                                )}
                            >
                                <CheckCircle2 className={cn("w-4 h-4", itemType === 'found' ? "animate-pulse" : "")} />
                                <span className="font-semibold text-sm">I Found It</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Title / Item Name</Label>
                        <Input id="title" {...register("title", { required: true })} placeholder="e.g. Black Dell Laptop" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select defaultValue="Other" onValueChange={(val) => setValue('category', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Electronics">Electronics</SelectItem>
                                <SelectItem value="Books">Books</SelectItem>
                                <SelectItem value="Clothing">Clothing</SelectItem>
                                <SelectItem value="Keys">Keys</SelectItem>
                                <SelectItem value="Documents">Documents</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" type="date" {...register("date", { required: true })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" {...register("location", { required: true })} placeholder="e.g. Library" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...register("description", { required: true })}
                            placeholder="Detailed description (color, brand, distinguishing marks...)"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact">Contact Info</Label>
                        <Input id="contact" {...register("contact", { required: true })} placeholder="Phone number or Email" />
                    </div>

                    <div className="space-y-2">
                        <Label>Image (Optional)</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                type="file"
                                accept="image/*"
                                className="cursor-pointer"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            />
                            {imageFile && <span className="text-xs text-muted-foreground">{imageFile.name}</span>}
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Submit Report
                    </Button>

                </form>
            </DialogContent>
        </Dialog>
    );
}
