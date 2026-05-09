
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
        // image_url is now derived from upload
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
                status: 'approved' // Auto-approve for immediate visibility
            });

            if (error) throw error;

            await logActivity(userId, "Listed Item", `Listed ${formData.title} for sale`);

            toast({ title: "Item Listed!", description: "Your item is now visible in the marketplace." });
            setFormData({ title: "", price: "", category: "Other", description: "" });
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
                    <DialogTitle>Sell an Item</DialogTitle>
                    <DialogDescription>
                        List your item for other students to see.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Item Name</Label>
                            <Input
                                id="title"
                                required
                                placeholder="e.g. Engineering Physics Book"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (₹)</Label>
                            <Input
                                id="price"
                                type="number"
                                required
                                placeholder="500"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(val) => setFormData({ ...formData, category: val })}
                        >
                            <SelectTrigger>
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
