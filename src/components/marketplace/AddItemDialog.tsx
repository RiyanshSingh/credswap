
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { logActivity } from "@/lib/activityLogger";

export function AddItemDialog({ open, onOpenChange, onSuccess, userId }: any) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        price: "",
        category: "Other",
        description: "",
        is_recommended: false,
        listing_type: "sell",
        rental_duration: ""
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith("image/")) {
                toast({
                    title: "Invalid file type",
                    description: "Please upload an image file (JPG, PNG).",
                    variant: "destructive"
                });
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                    title: "File too large",
                    description: "Image must be less than 5MB.",
                    variant: "destructive"
                });
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalImageUrl = "";

            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${userId}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

                // Upload to Supabase Storage
                // Assuming 'marketplace' bucket exists. If not, fallback to 'images' or user needs to create it.
                // Using 'marketplace' as per plan.
                const { error: uploadError } = await supabase.storage
                    .from('marketplace')
                    .upload(fileName, selectedFile);

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    // Fallback to 'public' or notify user
                    throw new Error("Failed to upload image. Please try again.");
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('marketplace')
                    .getPublicUrl(fileName);

                finalImageUrl = publicUrl;
            }

            const { error } = await supabase.from('marketplace_items').insert({
                title: formData.title,
                price: parseFloat(formData.price),
                category: formData.category,
                description: formData.description,
                image_url: finalImageUrl,
                seller_id: userId,
                is_recommended: formData.is_recommended,
                listing_type: formData.listing_type,
                rental_duration: formData.listing_type === 'rent' ? formData.rental_duration : null,
                status: 'approved' // Auto-approve for immediate visibility
            });

            if (error) throw error;

            await logActivity(userId, "Listed Item", `Listed ${formData.title} for sale`);

            toast({ title: "Item Listed!", description: "Your item is now visible in the marketplace." });
            setFormData({ title: "", price: "", category: "Other", description: "", is_recommended: false, listing_type: "sell", rental_duration: "" });
            clearFile();
            onSuccess();
            onOpenChange(false);

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-white">Sell an Item</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        List your item for other students to see.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="price" className="text-zinc-400">Price (₹)</Label>
                        <Input
                            id="price"
                            type="number"
                            required
                            placeholder="500"
                            className="bg-[#111] border-zinc-800 text-white"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center space-x-2 py-2">
                        <input
                            type="checkbox"
                            id="is_recommended"
                            className="w-4 h-4 rounded border-zinc-800 bg-[#111] text-white accent-white cursor-pointer"
                            checked={formData.is_recommended}
                            onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                        />
                        <Label htmlFor="is_recommended" className="text-zinc-300 cursor-pointer">Mark as Recommended (AI Test)</Label>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-zinc-400">Item Name</Label>
                        <Input
                            id="title"
                            required
                            placeholder="e.g. Engineering Physics Book"
                            className="bg-[#111] border-zinc-800 text-white"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger className="bg-[#111] border-zinc-800 text-white">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Books">Books</SelectItem>
                                    <SelectItem value="Electronics">Electronics</SelectItem>
                                    <SelectItem value="Furniture">Furniture</SelectItem>
                                    <SelectItem value="Stationery">Stationery</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="listing_type">Listing Type</Label>
                            <Select
                                value={formData.listing_type}
                                onValueChange={(val) => setFormData({ ...formData, listing_type: val })}
                            >
                                <SelectTrigger className="bg-[#111] border-zinc-800 text-white">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sell">Sell</SelectItem>
                                    <SelectItem value="rent">Rent</SelectItem>
                                    <SelectItem value="exchange">Exchange</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {formData.listing_type === 'rent' && (
                        <div className="space-y-2">
                            <Label htmlFor="rental_duration">Rental Duration</Label>
                            <Input
                                id="rental_duration"
                                required
                                placeholder="e.g. 1 Semester, 2 Months"
                                className="bg-[#111] border-zinc-800 text-white"
                                value={formData.rental_duration}
                                onChange={(e) => setFormData({ ...formData, rental_duration: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Condition, pickup location, etc."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-2">
                        <Label>Item Image</Label>
                        {!previewUrl ? (
                            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-secondary/50 transition-colors relative cursor-pointer group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                                    <div className="p-3 bg-secondary rounded-full">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium">Click to upload image</span>
                                    <span className="text-xs">Max 5MB</span>
                                </div>
                            </div>
                        ) : (
                            <div className="relative rounded-xl overflow-hidden border border-border aspect-video group">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="gap-2"
                                        onClick={clearFile}
                                    >
                                        <X className="w-4 h-4" /> Remove
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            List Item
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
