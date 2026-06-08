
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
            <DialogContent className="sm:max-w-[550px] bg-[#0a0a0a] border border-white/10 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-display font-bold text-white tracking-tight">Sell an Item</DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500 font-medium">
                        List your item for other students to see.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="max-h-[70vh] overflow-y-auto pr-2 -mr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Item Name</Label>
                        <Input
                            id="title"
                            required
                            placeholder="e.g. Engineering Physics Book"
                            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-10 rounded-xl px-4 font-bold"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 relative">
                            <div className="flex items-center justify-between ml-1">
                                <Label htmlFor="price" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Price (₹)</Label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!formData.title) {
                                            toast({ title: "Enter title first", description: "I need to know what you're selling to suggest a price.", variant: "destructive" });
                                            return;
                                        }
                                        setLoading(true);
                                        
                                        // Use Groq to get a realistic student-friendly price
                                        const prompt = `You are a campus marketplace price expert. A student is selling an item: "${formData.title}" in the category "${formData.category}". 
                                        Suggest a fair, competitive USED (pre-owned) price in Indian Rupees (₹) for a student-to-student marketplace. 
                                        Only return the numerical value, no text. e.g. 450`;

                                        fetch('https://api.groq.com/openai/v1/chat/completions', {
                                            method: 'POST',
                                            headers: {
                                                'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                                model: "llama-3.3-70b-specdec", // Updated to a more reliable model
                                                messages: [{ role: "user", content: prompt }],
                                                temperature: 0.1,
                                                max_tokens: 20
                                            })
                                        })
                                        .then(async res => {
                                            if (!res.ok) {
                                                const errData = await res.json();
                                                throw new Error(errData.error?.message || "API Error");
                                            }
                                            return res.json();
                                        })
                                        .then(data => {
                                            const content = data.choices[0].message.content;
                                            const suggested = parseInt(content.replace(/[^0-9]/g, '')) || 500;
                                            setFormData({ ...formData, price: suggested.toString() });
                                            setLoading(false);
                                            toast({ 
                                                title: "AI Price Suggestion", 
                                                description: `Based on campus trends for "${formData.title}", ₹${suggested} is a fair student price.`
                                            });
                                        })
                                        .catch((err) => {
                                            console.error("Groq AI Error:", err);
                                            setLoading(false);
                                            toast({ 
                                                title: "AI Suggestion Failed", 
                                                description: err.message.includes("API key") ? "API Key Issue. Please check .env" : "AI is currently busy. Please enter price manually.", 
                                                variant: "destructive" 
                                            });
                                        });
                                    }}
                                    className="text-zinc-500 hover:text-white transition-colors group"
                                    title="AI Price Suggestion"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-125 transition-transform"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                                </button>
                            </div>
                            <Input
                                id="price"
                                type="number"
                                required
                                placeholder="500"
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-10 rounded-xl px-4 font-bold"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-1 focus:ring-white/20 h-10 rounded-xl px-4 font-bold">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                                    <SelectItem value="Books">Books</SelectItem>
                                    <SelectItem value="Electronics">Electronics</SelectItem>
                                    <SelectItem value="Furniture">Furniture</SelectItem>
                                    <SelectItem value="Stationery">Stationery</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="listing_type" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Type</Label>
                            <Select
                                value={formData.listing_type}
                                onValueChange={(val) => setFormData({ ...formData, listing_type: val })}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-1 focus:ring-white/20 h-10 rounded-xl px-4 font-bold">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                                    <SelectItem value="sell">Sell</SelectItem>
                                    <SelectItem value="rent">Rent</SelectItem>
                                    <SelectItem value="exchange">Exchange</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 py-0.5 ml-1">
                        <input
                            type="checkbox"
                            id="is_recommended"
                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-white accent-white cursor-pointer"
                            checked={formData.is_recommended}
                            onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                        />
                        <Label htmlFor="is_recommended" className="text-[11px] font-bold text-zinc-400 cursor-pointer">Mark as Recommended (AI Test)</Label>
                    </div>

                    {formData.listing_type === 'rent' && (
                        <div className="space-y-2">
                            <Label htmlFor="rental_duration" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Rental Duration</Label>
                            <Input
                                id="rental_duration"
                                required
                                placeholder="e.g. 1 Semester, 2 Months"
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-10 rounded-xl px-4 font-bold"
                                value={formData.rental_duration}
                                onChange={(e) => setFormData({ ...formData, rental_duration: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Condition, pickup location, etc."
                            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl px-4 py-2.5 font-medium min-h-[80px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Item Image</Label>
                        {!previewUrl ? (
                            <div className="border-2 border-dashed border-white/10 rounded-2xl p-4 text-center hover:bg-white/[0.02] transition-colors relative cursor-pointer group flex flex-col items-center justify-center min-h-[100px]">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="flex flex-col items-center gap-3 text-zinc-500 group-hover:text-white transition-colors">
                                    <div className="p-2.5 bg-white/5 rounded-full border border-white/10 shadow-lg">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                                            <Upload className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-[11px] font-bold text-white tracking-wide">Click to upload</span>
                                        <span className="text-[9px] font-medium tracking-widest uppercase opacity-50">Max 5MB</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 h-32 w-full group shadow-xl bg-zinc-900/50">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <Button
                                        type="button"
                                        className="gap-2 bg-rose-500 text-white hover:bg-rose-600 font-bold uppercase tracking-widest text-[9px] rounded-lg h-8 px-4"
                                        onClick={clearFile}
                                    >
                                        <X className="w-3 h-3" /> Remove
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                    <DialogFooter className="mt-4 border-t border-white/5 pt-3">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            className="bg-transparent border-white/10 hover:bg-white/5 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl h-10 px-6"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.2em] text-[10px] rounded-xl h-10 px-8 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all"
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            List Item
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
