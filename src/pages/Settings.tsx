import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activityLogger";
import { useToast } from "@/components/ui/use-toast";
import indianColleges from "@/lib/indianColleges.json";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2,
    Save,
    ArrowLeft,
    User,
    Building,
    BookOpen,
    GraduationCap,
    Shield,
    Mail,
    LogOut,
    Trash2,
    Briefcase,
    Link as LinkIcon,
    Github,
    Linkedin,
    Globe,
    FileText,
    Camera,
    Palette,
    Plus
} from "lucide-react";
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
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ImageCropper } from "@/components/ImageCropper";
import { ModeToggle } from "@/components/ModeToggle";
import { sendEmail } from "@/lib/email";

interface ProfileFormValues {
    full_name: string;
    college: string;
    branch: string;
    semester: string;
    avatar_url: string;
    bio: string;
    skills: string;
    linkedin: string;
    github: string;
    portfolio: string;
    resume_link: string;
    headline: string;
    graduation_year: string;
    current_position: string;
    spoken_languages: string;
    interests: string;
    password_new?: string;
    password_confirm?: string;
}

const AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Calista",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Dante",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Elias",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Fiona",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=George",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Hanna",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jasmine",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Karl",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Nora",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Penelope",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Ruby",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
];

export default function Settings() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const [openCollege, setOpenCollege] = useState(false);

    // Sync tab state with URL query parameters
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        setSearchParams({ tab: val });
    };

    // Cropper State
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. File selected -> Read -> Open Cropper
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setCropImageSrc(reader.result?.toString() || null);
            setIsCropperOpen(true);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = "";
        });
        reader.readAsDataURL(file);
    };

    // 2. Crop Confirmed -> Upload Blob
    const handleCropComplete = async (croppedBlob: Blob) => {
        try {
            setIsUploading(true);

            const fileExt = "jpg"; // Canvas to Blob usually jpeg
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, croppedBlob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

            // Update local state
            setSelectedAvatar(publicUrl);
            setValue("avatar_url", publicUrl);
            setIsCropperOpen(false);

            toast({ title: "Image Uploaded", description: "Don't forget to save your changes." });

        } catch (error: any) {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    // Handle auth hash parsing delay (e.g. from password reset emails)
    const [isParsingHash, setIsParsingHash] = useState(
        window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery')
    );

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
                queryClient.invalidateQueries({ queryKey: ['session'] });
                setIsParsingHash(false);
            }
        });

        // Safety fallback: if no event fires within 3 seconds, release the lock
        const timer = setTimeout(() => setIsParsingHash(false), 3000);
        return () => {
            subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, [queryClient]);

    // Fetch Session
    const { data: session, isLoading: isSessionLoading } = useQuery({
        queryKey: ['session'],
        queryFn: async () => {
            const { data } = await supabase.auth.getSession();
            return data.session;
        }
    });

    // Fetch Profile
    const { data: profile } = useQuery({
        queryKey: ['profile', session?.user?.id],
        enabled: !!session?.user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session?.user?.id)
                .single();
            if (error) throw error;
            return data;
        }
    });

    const { data: dbColleges } = useQuery({
        queryKey: ['colleges-list'],
        queryFn: async () => {
            const { data } = await supabase.from('communities').select('name').eq('type', 'college').order('name');
            return data?.map((c: any) => c.name) || [];
        }
    });

    const jsonColleges = indianColleges as string[];
    const collegesList = Array.from(new Set([...(dbColleges || []), ...jsonColleges])).sort();

    const { register, handleSubmit, setValue, watch, formState: { errors }, getValues } = useForm<ProfileFormValues>({
        shouldUnregister: false
    });

    useEffect(() => {
        if (profile) {
            setValue("full_name", profile.full_name || "");
            setValue("college", profile.college || "");
            setValue("branch", profile.branch || "");
            setValue("semester", profile.semester || "");
            setValue("bio", profile.bio || "");
            setValue("skills", profile.skills || "");
            setValue("linkedin", profile.linkedin || "");
            setValue("github", profile.github || "");
            setValue("portfolio", profile.portfolio || "");
            setValue("resume_link", profile.resume_link || "");
            setValue("headline", profile.headline || "");
            setValue("graduation_year", profile.graduation_year || "");
            setValue("current_position", profile.current_position || "");
            setValue("spoken_languages", profile.spoken_languages ? profile.spoken_languages.join(", ") : "");
            setValue("interests", profile.interests ? profile.interests.join(", ") : "");
            if (profile.avatar_url) {
                setSelectedAvatar(profile.avatar_url);
                setValue("avatar_url", profile.avatar_url);
            }
        }
    }, [profile, setValue]);

    const onSubmit = async (data: ProfileFormValues) => {
        if (!session?.user) return;

        // Security block for reserved names
        const reservedNames = ["admin", "credswap"];
        const adminEmails = ["itsyourriyansh@gmail.com", "credswap@gmail.com"];
        const trimmedName = data.full_name.trim().toLowerCase();
        const userEmail = session.user.email?.toLowerCase();

        const isReserved = reservedNames.some(name => trimmedName === name);
        const isAdminEmail = adminEmails.includes(userEmail || '');

        // Block if name is changed TO a reserved name (and user is not an admin)
        if (data.full_name.trim() !== profile?.full_name && isReserved && !isAdminEmail) {
            toast({
                title: "Name Restricted",
                description: "The name '" + data.full_name + "' is reserved for system security. Please use a different name.",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);

        try {
            const updateData = {
                id: session.user.id,
                full_name: data.full_name,
                college: data.college,
                branch: data.branch,
                semester: data.semester,
                avatar_url: selectedAvatar,
                bio: data.bio, // This is the 'About Me' from first tab
                skills: data.skills,
                linkedin: data.linkedin,
                github: data.github,
                portfolio: data.portfolio,
                resume_link: data.resume_link,
                headline: data.headline,
                graduation_year: data.graduation_year,
                current_position: data.current_position,
                spoken_languages: data.spoken_languages ? data.spoken_languages.split(',').map(s => s.trim()).filter(Boolean) : [],
                interests: data.interests ? data.interests.split(',').map(s => s.trim()).filter(Boolean) : [],
                updated_at: new Date().toISOString(),
            };

            console.log("Saving profile data:", updateData);

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert(updateData)
                .select();

            if (profileError) {
                console.error("Supabase error:", profileError);
                throw profileError;
            }

            // Sync with Auth metadata as well
            await supabase.auth.updateUser({
                data: { full_name: data.full_name }
            });

            console.log("Profile saved successfully. Invalidating cache...");
            await logActivity(session.user.id, "Updated Profile", "User updated their profile details");
            // Force refresh of profile data and activities
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['activities'] });

            toast({
                title: "Settings Saved",
                description: "Your profile has been updated successfully.",
            });
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast({
                title: "Update Failed",
                description: error.message || "Could not save changes.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const location = useLocation();
    const backPath = location.state?.from || "/dashboard";

    useEffect(() => {
        // Prevent redirecting if we are still parsing an auth token from the email URL
        if (!isSessionLoading && !session && !isParsingHash) {
            navigate("/auth");
        }
    }, [isSessionLoading, session, isParsingHash, navigate]);

    if (isSessionLoading || isParsingHash) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">{isParsingHash ? "Authenticating securely..." : "Loading settings..."}</p>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-20 md:pb-0 font-sans selection:bg-white/10">
            <Navbar />

            <main className="container mx-auto px-6 lg:px-8 py-8 md:py-12">
                <Link to={backPath} className="inline-flex items-center text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Link>

                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar / Tabs List */}
                        <div className="w-full lg:w-72 space-y-8">
                            <div className="px-2">
                                <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-2">Settings</h1>
                                <p className="text-zinc-500 text-sm font-medium">Manage your campus profile & account.</p>
                            </div>

                            <Tabs value={activeTab} onValueChange={handleTabChange} orientation="vertical" className="w-full">
                                <TabsList className="flex flex-col h-auto bg-transparent space-y-1.5 p-0">
                                    <TabsTrigger
                                        value="profile"
                                        className="w-full justify-start px-4 py-3.5 rounded-xl border border-transparent data-[state=active]:bg-white/5 data-[state=active]:border-white/10 data-[state=active]:text-white text-zinc-400 hover:text-zinc-200 transition-all font-bold text-[13px] uppercase tracking-wider"
                                    >
                                        <User className="w-4 h-4 mr-3 opacity-70" />
                                        My Profile
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="academic"
                                        className="w-full justify-start px-4 py-3.5 rounded-xl border border-transparent data-[state=active]:bg-white/5 data-[state=active]:border-white/10 data-[state=active]:text-white text-zinc-400 hover:text-zinc-200 transition-all font-bold text-[13px] uppercase tracking-wider"
                                    >
                                        <GraduationCap className="w-4 h-4 mr-3 opacity-70" />
                                        Academic Info
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="professional"
                                        className="w-full justify-start px-4 py-3.5 rounded-xl border border-transparent data-[state=active]:bg-white/5 data-[state=active]:border-white/10 data-[state=active]:text-white text-zinc-400 hover:text-zinc-200 transition-all font-bold text-[13px] uppercase tracking-wider"
                                    >
                                        <Briefcase className="w-4 h-4 mr-3 opacity-70" />
                                        Professional
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="account"
                                        className="w-full justify-start px-4 py-3.5 rounded-xl border border-transparent data-[state=active]:bg-white/5 data-[state=active]:border-white/10 data-[state=active]:text-white text-zinc-400 hover:text-zinc-200 transition-all font-bold text-[13px] uppercase tracking-wider"
                                    >
                                        <Shield className="w-4 h-4 mr-3 opacity-70" />
                                        Security
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="theme"
                                        className="w-full justify-start px-4 py-3.5 rounded-xl border border-transparent data-[state=active]:bg-white/5 data-[state=active]:border-white/10 data-[state=active]:text-white text-zinc-400 hover:text-zinc-200 transition-all font-bold text-[13px] uppercase tracking-wider"
                                    >
                                        <Palette className="w-4 h-4 mr-3 opacity-70" />
                                        Appearance
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="pt-8 border-t border-white/5 mt-8">
                                <Button 
                                    variant="ghost" 
                                    className="w-full justify-start px-4 py-3.5 rounded-xl text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all font-bold text-[13px] uppercase tracking-wider"
                                    onClick={() => setIsLogoutDialogOpen(true)}
                                >
                                    <LogOut className="w-4 h-4 mr-3" />
                                    Sign Out
                                </Button>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1">
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

                                    {/* PROFILE TAB */}
                                    <TabsContent value="profile" className="space-y-6 mt-0">
                                        <Card className="bg-[#0a0a0a] border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                                            <CardHeader className="border-b border-white/5 pb-6">
                                                <CardTitle className="text-xl font-bold text-white tracking-tight">Profile Details</CardTitle>
                                                <CardDescription className="text-zinc-500 font-medium">Customize how you look on Cloudburst.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-8 pt-8">

                                                {/* Avatar Picker */}
                                                <div className="space-y-4">
                                                    <Label className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Profile Photo</Label>
                                                    <div className="flex items-center gap-6 mb-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                                        <div className="relative group">
                                                            <input
                                                                type="file"
                                                                ref={fileInputRef}
                                                                onChange={handleFileSelect}
                                                                className="hidden"
                                                                accept="image/*"
                                                            />
                                                            <div
                                                                className="w-20 h-20 rounded-full bg-zinc-800 overflow-hidden ring-4 ring-white/5 shadow-2xl relative cursor-pointer group transition-all"
                                                                onClick={() => fileInputRef.current?.click()}
                                                            >
                                                                {isUploading ? (
                                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
                                                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-10 backdrop-blur-[2px]">
                                                                        <Camera className="w-6 h-6 text-white scale-90 group-hover:scale-100 transition-transform duration-300" />
                                                                    </div>
                                                                )}
                                                                <img src={selectedAvatar} alt="Selected Avatar" className="w-full h-full object-cover" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <h4 className="font-bold text-sm text-white tracking-tight">Custom Identity</h4>
                                                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">Upload a clear photo or choose from our presets below.</p>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => fileInputRef.current?.click()}
                                                                disabled={isUploading}
                                                                className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl h-8 px-4 mt-1"
                                                            >
                                                                Upload New
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <ImageCropper
                                                        open={isCropperOpen}
                                                        onOpenChange={setIsCropperOpen}
                                                        imageSrc={cropImageSrc}
                                                        onCropComplete={handleCropComplete}
                                                        isUploading={isUploading}
                                                    />
                                                    <div className="grid grid-cols-5 md:grid-cols-10 gap-2.5">
                                                        {AVATARS.map((avatar, i) => (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                onClick={() => setSelectedAvatar(avatar)}
                                                                className={cn(
                                                                    "w-9 h-9 rounded-full overflow-hidden border-2 transition-all hover:scale-110",
                                                                    selectedAvatar === avatar ? "border-white ring-4 ring-white/10" : "border-transparent opacity-40 hover:opacity-100"
                                                                )}
                                                            >
                                                                <img src={avatar} alt={`Avatar ${i}`} className="w-full h-full" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Name Input */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="full_name" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Full Name</Label>
                                                        <Input
                                                            id="full_name"
                                                            placeholder="Your Name"
                                                            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-xl px-4 font-bold"
                                                            {...register("full_name")}
                                                        />
                                                    </div>

                                                    {/* Headline Input */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="headline" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Tagline</Label>
                                                        <Input
                                                            id="headline"
                                                            placeholder="e.g. Aspiring Developer"
                                                            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-xl px-4 font-bold"
                                                            {...register("headline")}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Bio */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="bio" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">About Me</Label>
                                                    <Textarea
                                                        id="bio"
                                                        placeholder="Share your interests..."
                                                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl px-4 py-3 font-medium min-h-[120px]"
                                                        {...register("bio")}
                                                    />
                                                </div>
                                            </CardContent>
                                            <CardFooter className="bg-white/[0.02] border-t border-white/5 flex justify-end py-6 px-8">
                                                <Button 
                                                    type="submit" 
                                                    disabled={isSaving}
                                                    className="bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.2em] text-[11px] rounded-xl h-11 px-10 shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all"
                                                >
                                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                    Save Changes
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="academic" className="space-y-6 mt-0">
                                        <Card className="bg-[#0a0a0a] border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                                            <CardHeader className="border-b border-white/5 pb-6">
                                                <CardTitle className="text-xl font-bold text-white tracking-tight">Academic Information</CardTitle>
                                                <CardDescription className="text-zinc-500 font-medium">Verified campus data for personalized tools.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-8 pt-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="college" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">College / University</Label>
                                                        <div className="relative group">
                                                            <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors z-10" />
                                                            <Input 
                                                                className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-xl font-bold"
                                                                placeholder="Search your college..."
                                                                value={watch("college") || ""}
                                                                onChange={(e) => {
                                                                    setValue("college", e.target.value);
                                                                    if (!openCollege) setOpenCollege(true);
                                                                }}
                                                                onFocus={() => { if (watch("college")) setOpenCollege(true); }}
                                                                onBlur={() => setTimeout(() => setOpenCollege(false), 200)}
                                                            />
                                                            {openCollege && watch("college") && (
                                                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 shadow-2xl rounded-xl z-50 overflow-hidden backdrop-blur-xl">
                                                                    <ul className="max-h-60 overflow-y-auto p-1.5 text-sm text-zinc-300">
                                                                        {(() => {
                                                                            const search = (watch("college") || "").toLowerCase();
                                                                            const matches = collegesList.filter((c: string) => c.toLowerCase().includes(search)).slice(0, 50);
                                                                            
                                                                            if (matches.length === 0) {
                                                                                const typed = watch("college") || "";
                                                                                return (
                                                                                    <li 
                                                                                        className="px-4 py-3 flex items-center gap-2 hover:bg-white/5 cursor-pointer rounded-lg text-white font-bold transition-all"
                                                                                        onMouseDown={(e) => {
                                                                                            e.preventDefault();
                                                                                            setValue("college", typed);
                                                                                            setOpenCollege(false);
                                                                                        }}
                                                                                    >
                                                                                        <Plus className="w-4 h-4" /> Add "{typed}"
                                                                                    </li>
                                                                                );
                                                                            }
                                                                            
                                                                            return matches.map(c => (
                                                                                <li 
                                                                                    key={c} 
                                                                                    className="px-4 py-3 hover:bg-white/5 cursor-pointer rounded-lg transition-all font-medium hover:text-white"
                                                                                    onMouseDown={(e) => {
                                                                                        e.preventDefault();
                                                                                        setValue("college", c);
                                                                                        setOpenCollege(false);
                                                                                    }}
                                                                                >
                                                                                    {c}
                                                                                </li>
                                                                            ));
                                                                        })()}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="branch" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Branch / Stream</Label>
                                                        <div className="relative group">
                                                            <BookOpen className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                                                            <Input className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-xl font-bold" id="branch" placeholder="e.g. Computer Science" {...register("branch")} />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="semester" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Current Year/Sem</Label>
                                                        <Select
                                                            onValueChange={(val) => setValue("semester", val)}
                                                            defaultValue={profile?.semester || ""}
                                                            value={watch("semester")}
                                                        >
                                                            <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-1 focus:ring-white/20 h-11 rounded-xl px-4 font-bold">
                                                                <SelectValue placeholder="Select Semester" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#111] border-white/10 text-white">
                                                                {["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"].map((sem) => (
                                                                    <SelectItem key={sem} value={sem} className="focus:bg-white/5 focus:text-white">{sem}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="graduation_year" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Graduation</Label>
                                                        <Select
                                                            onValueChange={(val) => setValue("graduation_year", val)}
                                                            defaultValue={profile?.graduation_year || ""}
                                                            value={watch("graduation_year")}
                                                        >
                                                            <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-1 focus:ring-white/20 h-11 rounded-xl px-4 font-bold">
                                                                <SelectValue placeholder="Select Year" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#111] border-white/10 text-white">
                                                                {["2024", "2025", "2026", "2027", "2028"].map((year) => (
                                                                    <SelectItem key={year} value={year} className="focus:bg-white/5 focus:text-white">{year}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="bg-white/[0.02] border-t border-white/5 flex justify-end py-6 px-8">
                                                <Button 
                                                    type="submit" 
                                                    disabled={isSaving}
                                                    className="bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.2em] text-[11px] rounded-xl h-11 px-10 shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all"
                                                >
                                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                    Save Changes
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </TabsContent>

                                    {/* PROFESSIONAL TAB */}
                                    <TabsContent value="professional" className="space-y-6 mt-0">
                                        <Card className="bg-[#0a0a0a] border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                                            <CardHeader className="border-b border-white/5 pb-6">
                                                <CardTitle className="text-xl font-bold text-white tracking-tight">Professional Profile</CardTitle>
                                                <CardDescription className="text-zinc-500 font-medium">Showcase your skills and campus presence.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-8 pt-8">

                                                {/* Current Role */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="current_position" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Current Role / Goal</Label>
                                                    <div className="relative group">
                                                        <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                                                        <Input className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-xl font-bold" id="current_position" placeholder="e.g. Intern at Google, Tech Lead" {...register("current_position")} />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Skills */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="skills" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Key Skills</Label>
                                                        <Input className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-xl px-4 font-bold" id="skills" placeholder="React, Python, etc." {...register("skills")} />
                                                    </div>

                                                    {/* Interests */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="interests" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Interests</Label>
                                                        <Input className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-xl px-4 font-bold" id="interests" placeholder="Web3, AI, etc." {...register("interests")} />
                                                    </div>
                                                </div>

                                                {/* Social Links */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="linkedin" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">LinkedIn</Label>
                                                        <div className="relative group">
                                                            <Linkedin className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-[#0077b5] transition-colors" />
                                                            <Input className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-xl font-bold" id="linkedin" placeholder="linkedin.com/in/..." {...register("linkedin")} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="github" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">GitHub</Label>
                                                        <div className="relative group">
                                                            <Github className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                                                            <Input className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-xl font-bold" id="github" placeholder="github.com/..." {...register("github")} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="portfolio" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Portfolio</Label>
                                                        <div className="relative group">
                                                            <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                                                            <Input className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-xl font-bold" id="portfolio" placeholder="https://..." {...register("portfolio")} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="resume_link" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Resume Link</Label>
                                                        <div className="relative group">
                                                            <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-rose-400 transition-colors" />
                                                            <Input className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-xl font-bold" id="resume_link" placeholder="Drive/Dropbox link" {...register("resume_link")} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="bg-white/[0.02] border-t border-white/5 flex justify-end py-6 px-8">
                                                <Button 
                                                    type="submit" 
                                                    disabled={isSaving}
                                                    className="bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.2em] text-[11px] rounded-xl h-11 px-10 shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all"
                                                >
                                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                    Save Changes
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </TabsContent>

                                    {/* THEME TAB */}
                                    <TabsContent value="theme" className="space-y-6 mt-0">
                                        <Card className="bg-[#0a0a0a] border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                                            <CardHeader className="border-b border-white/5 pb-6">
                                                <CardTitle className="text-xl font-bold text-white tracking-tight">Appearance</CardTitle>
                                                <CardDescription className="text-zinc-500 font-medium">Personalize your application experience.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-8 pt-8">
                                                <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                                    <div className="space-y-1">
                                                        <Label className="text-sm font-bold text-white tracking-tight">Theme Mode</Label>
                                                        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                                            Switch between Light, Dark, or System defaults.
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <ModeToggle />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* ACCOUNT TAB (Account Settings) */}
                                    <TabsContent value="account" className="space-y-6 mt-0">
                                        <Card className="bg-[#0a0a0a] border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                                            <CardHeader className="border-b border-white/5 pb-6">
                                                <CardTitle className="text-xl font-bold text-white tracking-tight">Account Security</CardTitle>
                                                <CardDescription className="text-zinc-500 font-medium">Manage your campus credentials and safety.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-8 pt-8">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Email Address</Label>
                                                    <div className="relative group">
                                                        <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                                                        <Input className="pl-11 bg-white/5 border-white/10 text-zinc-500 h-11 rounded-xl font-bold cursor-not-allowed opacity-60" value={session.user.email} disabled />
                                                    </div>
                                                    <p className="text-[10px] text-zinc-600 font-medium px-1">Email is linked to your campus account and cannot be modified.</p>
                                                </div>

                                                <div className="space-y-6 pt-6 border-t border-white/5">
                                                    <h4 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1 flex items-center gap-2">
                                                        <Shield className="w-3 h-3" /> Change Password
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="new-password" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">New Password</Label>
                                                            <Input
                                                                id="new-password"
                                                                type="password"
                                                                placeholder="Min 6 characters"
                                                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-xl font-bold"
                                                                onChange={(e) => setValue("password_new", e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="confirm-password" className="text-[10px] font-black tracking-widest text-zinc-500 uppercase ml-1">Confirm Password</Label>
                                                            <Input
                                                                id="confirm-password"
                                                                type="password"
                                                                placeholder="Re-enter password"
                                                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 h-11 rounded-xl font-bold"
                                                                onChange={(e) => setValue("password_confirm", e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        onClick={async () => {
                                                            const p1 = watch("password_new");
                                                            const p2 = watch("password_confirm");
                                                            if (!p1 || p1.length < 6) return toast({ title: "Invalid Password", description: "Must be at least 6 characters", variant: "destructive" });
                                                            if (p1 !== p2) return toast({ title: "Mismatch", description: "Passwords do not match", variant: "destructive" });

                                                            setIsSaving(true);
                                                            const { error } = await supabase.auth.updateUser({ password: p1 });
                                                            setIsSaving(false);

                                                            if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                                                            else {
                                                                toast({ title: "Success", description: "Password updated successfully." });
                                                                setValue("password_new", "");
                                                                setValue("password_confirm", "");

                                                                if (session?.user?.email) {
                                                                    sendEmail({
                                                                        type: "password_changed",
                                                                        payload: {
                                                                            email: session.user.email,
                                                                            name: profile?.full_name || session.user.user_metadata?.full_name || ''
                                                                        }
                                                                    }).catch(e => console.error("Failed to send password changed email alert:", e));
                                                                }
                                                            }
                                                        }}
                                                        disabled={isSaving}
                                                        className="bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.2em] text-[11px] rounded-xl h-11 px-8 shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all"
                                                    >
                                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                        Update Password
                                                    </Button>
                                                </div>

                                                <div className="border-t border-white/5 pt-8 mt-8">
                                                    <h4 className="text-[10px] font-black tracking-widest text-rose-500 uppercase ml-1 mb-4">Danger Zone</h4>
                                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 border border-rose-500/10 bg-rose-500/[0.02] rounded-2xl">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-white tracking-tight">Sign Out</p>
                                                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">Securely log out of this device.</p>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            className="bg-transparent border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl h-11 px-6 font-bold uppercase tracking-widest text-[10px] transition-all"
                                                            onClick={() => setIsLogoutDialogOpen(true)}
                                                        >
                                                            <LogOut className="w-4 h-4 mr-2" />
                                                            Sign Out
                                                        </Button>
                                                    </div>

                                                    <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                                                        <AlertDialogContent className="w-[90%] max-w-[380px] rounded-3xl p-6">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Ready to leave?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    You are about to log out from Campus Connect. You can always sign back in later.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter className="gap-2 sm:gap-0">
                                                                <AlertDialogCancel>Stay Signed In</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    onClick={async () => {
                                                                        await logActivity(session.user.id, "Logged Out", "User manually logged out");
                                                                        queryClient.clear();
                                                                        await supabase.auth.signOut();
                                                                        navigate("/");
                                                                    }}
                                                                >
                                                                    Logout
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
