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
import { Loader2, Upload, X, Wifi, Wind, Utensils, Tv, Car, Check, Link as LinkIcon, Lightbulb, Bed, Fan } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AMENITIES_LIST = [
    "WiFi", "AC", "Fan", "Light", "Bed", "Food/Mess", "Laundry", "Parking", "TV", "Attached Washroom", "Power Backup"
];

export function AddRoomDialog({ open, onOpenChange, onSuccess, userId }: any) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    // Form State
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
        setFormData(prev => {
            const exists = prev.amenities.includes(amenity);
            if (exists) {
                return { ...prev, amenities: prev.amenities.filter(a => a !== amenity) };
            } else {
                return { ...prev, amenities: [...prev.amenities, amenity] };
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
            if (files.length + selectedFiles.length > 5) {
                toast({ title: "Limit Exceeded", description: "You can upload a maximum of 5 images.", variant: "destructive" });
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
        setLoading(true);

        try {
            let finalImageUrls: string[] = [];

            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `rooms/${userId}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('marketplace') // Reusing marketplace bucket for simplicity
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('marketplace')
                        .getPublicUrl(fileName);

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
                status: 'pending' // Waiting for admin approval
            });

            if (error) throw error;

            toast({ title: "Room Submitted!", description: "Your listing is pending admin approval." });
            setFormData({ title: "", price: "", location: "", type: "Single", description: "", video_link: "", amenities: [] });
            setPreviewUrls([]);
            setSelectedFiles([]);
            onSuccess();
            onOpenChange(false);

        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: "Failed to create listing.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>List a Room</DialogTitle>
                    <DialogDescription>
                        Fill in the details to rent out your room or flat.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Title & Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title" placeholder="e.g. Spacious Single Room" required
                                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Rent (₹/month)</Label>
                            <Input
                                id="price" type="number" placeholder="5000" required
                                value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Location & Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="location">Location/Area</Label>
                            <Input
                                id="location" placeholder="e.g. Near North Gate" required
                                value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select value={formData.type} onValueChange={val => setFormData({ ...formData, type: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Single">Single Room</SelectItem>
                                    <SelectItem value="Shared">Shared Room</SelectItem>
                                    <SelectItem value="PG">Pay Guest (PG)</SelectItem>
                                    <SelectItem value="Flat">Full Flat</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Amenities Multi-Select */}
                    <div className="space-y-2">
                        <Label>Amenities</Label>
                        <div className="flex flex-wrap gap-2">
                            {AMENITIES_LIST.map(amenity => (
                                <Badge
                                    key={amenity}
                                    variant={formData.amenities.includes(amenity) ? "default" : "outline"}
                                    className="cursor-pointer select-none"
                                    onClick={() => handleAmenityToggle(amenity)}
                                >
                                    {amenity}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description" placeholder="Additional details..."
                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Video Link */}
                    <div className="space-y-2">
                        <Label htmlFor="video_link" className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" /> Video/Drive Link (Optional)
                        </Label>
                        <Input
                            id="video_link" placeholder="https://drive.google.com/..."
                            value={formData.video_link} onChange={e => setFormData({ ...formData, video_link: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Upload a room tour video to GDrive/YouTube and paste the link here.</p>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label>Room Images (Up to 5)</Label>

                        {previewUrls.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {previewUrls.map((url, i) => (
                                    <div key={i} className="relative rounded-xl overflow-hidden aspect-video border border-border group">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <Button
                                            type="button" variant="destructive" size="icon"
                                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeImage(i)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {previewUrls.length < 5 && (
                            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-secondary/20 hover:bg-secondary/40 transition-colors relative cursor-pointer">
                                <input type="file" accept="image/*" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-foreground font-medium">Click to select photos</p>
                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            List Room
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
