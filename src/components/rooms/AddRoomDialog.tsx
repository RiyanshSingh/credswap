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
import { Loader2, Upload, X, Home, MapPin, Wallet, Building2, Link as LinkIcon, Camera, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const AMENITIES_LIST = [
    "WiFi", "AC", "Fan", "Light", "Bed", "Food/Mess", "Laundry", "Parking", "TV", "Attached Washroom", "Power Backup"
];

export function AddRoomDialog({ open, onOpenChange, onSuccess, userId }: any) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        title: "",
        price: "",
        location: "",
        type: "Single",
        description: "",
        video_link: "",
        amenities: [] as string[]
    });

    const handleAmenityToggle = (amenity: string) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
            if (files.length + selectedFiles.length > 5) {
                toast({ title: "Quota Exceeded", description: "Maximum allocation is 5 assets.", variant: "destructive" });
                return;
            }
            setSelectedFiles(prev => [...prev, ...files]);
            const newUrls = files.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newUrls]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            const newUrls = [...prev];
            URL.revokeObjectURL(newUrls[index]);
            newUrls.splice(index, 1);
            return newUrls;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) {
            toast({ title: "Identity Nullified", description: "Authentication required to initiate protocol.", variant: "destructive" });
            return;
        }
        setLoading(true);

        try {
            let finalImageUrls: string[] = [];

            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `rooms/${userId}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage.from('marketplace').upload(fileName, file);
                    if (uploadError) throw uploadError;
                    const { data: { publicUrl } } = supabase.storage.from('marketplace').getPublicUrl(fileName);
                    finalImageUrls.push(publicUrl);
                }
            }

            const { error } = await supabase.from('rooms').insert({
                title: formData.title,
                price: parseFloat(formData.price),
                location: formData.location,
                type: formData.type,
                description: formData.description,
                video_link: formData.video_link || null,
                amenities: formData.amenities,
                images: finalImageUrls,
                owner_id: userId,
                status: 'pending'
            });

            if (error) throw error;

            toast({ title: "Protocol Engaged", description: "Listing synchronized. Pending administrative audit." });
            setFormData({ title: "", price: "", location: "", type: "Single", description: "", video_link: "", amenities: [] });
            setPreviewUrls([]);
            setSelectedFiles([]);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Listing Creation Failure:", error);
            toast({ title: "Sync Error", description: error.message || "Failed to initialize listing protocol.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[92vh] overflow-y-auto bg-[#0a0a0a]/95 border-white/10 backdrop-blur-3xl rounded-[40px] p-0 shadow-2xl overflow-x-hidden selection:bg-white selection:text-black no-scrollbar">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                <div className="p-8 sm:p-10">
                    <DialogHeader className="mb-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                <Home className="w-6 h-6 text-black" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-display font-bold text-white tracking-tight">Strategic Listing</DialogTitle>
                                <DialogDescription className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">
                                    Define Housing Parameters
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> Designation
                                </Label>
                                <Input
                                    placeholder="e.g. Premium Single Suite" required
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="h-14 bg-white/5 border-white/5 rounded-2xl focus:bg-white/10 transition-all font-bold text-white placeholder:text-zinc-700 px-6"
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between ml-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                        <Wallet className="w-3 h-3" /> Monthly Resource
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!formData.location) {
                                                toast({ title: "Coordinates Required", description: "Define a location to estimate market value.", variant: "destructive" });
                                                return;
                                            }
                                            setLoading(true);
                                            setTimeout(() => {
                                                let base = 5000;
                                                if (formData.type === 'PG') base = 8000;
                                                else if (formData.type === 'Flat') base = 15000;
                                                else if (formData.type === 'Single') base = 6000;
                                                
                                                // Adjust for location
                                                if (formData.location.toLowerCase().includes('sector')) base += 2000;
                                                
                                                setFormData({ ...formData, price: base.toString() });
                                                setLoading(false);
                                                toast({ 
                                                    title: "AI Valuation", 
                                                    description: `Optimized rate for ${formData.type} in ${formData.location} is ₹${base}/mo.`
                                                });
                                            }, 800);
                                        }}
                                        className="text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <Input
                                    type="number" placeholder="Value in ₹" required
                                    value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="h-14 bg-white/5 border-white/5 rounded-2xl focus:bg-white/10 transition-all font-bold text-white placeholder:text-zinc-700 px-6"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2 flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> Geo-Coordinates
                                </Label>
                                <Input
                                    placeholder="e.g. North Sector Nexus" required
                                    value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="h-14 bg-white/5 border-white/5 rounded-2xl focus:bg-white/10 transition-all font-bold text-white placeholder:text-zinc-700 px-6"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2 flex items-center gap-2">
                                    <Building2 className="w-3 h-3" /> Configuration
                                </Label>
                                <Select value={formData.type} onValueChange={val => setFormData({ ...formData, type: val })}>
                                    <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-2xl focus:bg-white/10 transition-all font-bold text-white px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-white/10 rounded-2xl">
                                        <SelectItem value="Single">Single Node</SelectItem>
                                        <SelectItem value="Shared">Shared Cluster</SelectItem>
                                        <SelectItem value="PG">Managed PG</SelectItem>
                                        <SelectItem value="Flat">Total Flat</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Internal Amenities</Label>
                            <div className="flex flex-wrap gap-2">
                                {AMENITIES_LIST.map(amenity => (
                                    <button
                                        key={amenity}
                                        type="button"
                                        onClick={() => handleAmenityToggle(amenity)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                            formData.amenities.includes(amenity)
                                                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                                : "bg-white/5 text-zinc-500 border-white/5 hover:border-white/20 hover:text-white"
                                        )}
                                    >
                                        {amenity}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Detailed Briefing</Label>
                            <Textarea
                                placeholder="Additional environmental data..."
                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="min-h-[120px] bg-white/5 border-white/5 rounded-3xl focus:bg-white/10 transition-all font-bold text-white placeholder:text-zinc-700 p-6 resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2 flex items-center gap-2">
                                <LinkIcon className="w-3 h-3" /> Digital Relay (Optional)
                            </Label>
                            <Input
                                placeholder="https://drive.google.com/..."
                                value={formData.video_link} onChange={e => setFormData({ ...formData, video_link: e.target.value })}
                                className="h-14 bg-white/5 border-white/5 rounded-2xl focus:bg-white/10 transition-all font-bold text-white placeholder:text-zinc-700 px-6"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2 flex items-center gap-2">
                                <Camera className="w-3 h-3" /> Visual Assets (Limit 05)
                            </Label>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <AnimatePresence>
                                    {previewUrls.map((url, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="relative rounded-[24px] overflow-hidden aspect-square border border-white/10 group"
                                        >
                                            <img src={url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <button
                                                type="button"
                                                className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeImage(i)}
                                            >
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {previewUrls.length < 5 && (
                                    <label className="relative aspect-square border-2 border-dashed border-white/5 rounded-[24px] flex flex-col items-center justify-center bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer group">
                                        <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                            <Upload className="w-5 h-5 text-zinc-500" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Sync Assets</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="pt-6 pb-2">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-14 px-8 rounded-2xl text-zinc-500 hover:text-white transition-all font-bold">Abort</Button>
                            <Button type="submit" disabled={loading} className="h-16 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] hover:bg-zinc-200 shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98]">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initiate Listing"}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
