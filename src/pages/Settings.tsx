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
    Palette
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
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <Link to={backPath} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                </Link>

                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Sidebar / Tabs List */}
                        <div className="w-full md:w-64 space-y-2">
                            <h1 className="text-2xl font-display font-bold mb-6 px-2">Settings</h1>

                            <Tabs value={activeTab} onValueChange={handleTabChange} orientation="vertical" className="w-full">
                                <TabsList className="flex flex-col h-auto bg-transparent space-y-1 p-0">
                                    <TabsTrigger
                                        value="profile"
                                        className="w-full justify-start px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-foreground"
                                    >
                                        <User className="w-4 h-4 mr-3" />
                                        My Profile
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="academic"
                                        className="w-full justify-start px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-foreground"
                                    >
                                        <GraduationCap className="w-4 h-4 mr-3" />
                                        Academic Info
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="professional"
                                        className="w-full justify-start px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-foreground"
                                    >
                                        <Briefcase className="w-4 h-4 mr-3" />
                                        Professional Profile
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="account"
                                        className="w-full justify-start px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-foreground"
                                    >
                                        <Shield className="w-4 h-4 mr-3" />
                                        Account Security
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="theme"
                                        className="w-full justify-start px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-foreground"
                                    >
                                        <Palette className="w-4 h-4 mr-3" />
                                        App Theme
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1">
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

                                    {/* PROFILE TAB */}
                                    <TabsContent value="profile" className="space-y-6 mt-0">
                                        <Card className="border-border/50 shadow-sm">
                                            <CardHeader>
                                                <CardTitle>Profile Details</CardTitle>
                                                <CardDescription>Customize how you look on Campus Connect.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">

                                                {/* Avatar Picker */}
                                                <div className="space-y-4">
                                                    <Label>Choose Avatar</Label>
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="relative group">
                                                            <input
                                                                type="file"
                                                                ref={fileInputRef}
                                                                onChange={handleFileSelect}
                                                                className="hidden"
                                                                accept="image/*"
                                                            />
                                                            <div
                                                                className="w-24 h-24 rounded-full bg-secondary overflow-hidden ring-4 ring-background shadow-lg relative cursor-pointer"
                                                                onClick={() => fileInputRef.current?.click()}
                                                            >
                                                                {isUploading ? (
                                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                                                        <Camera className="w-8 h-8 text-white" />
                                                                    </div>
                                                                )}
                                                                <img src={selectedAvatar} alt="Selected Avatar" className="w-full h-full object-cover" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-sm">Profile Picture</h4>
                                                            <p className="text-xs text-muted-foreground mb-2">Upload a custom photo or choose a preset.</p>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => fileInputRef.current?.click()}
                                                                disabled={isUploading}
                                                            >
                                                                Upload Photo
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
                                                    <div className="grid grid-cols-5 md:grid-cols-8 gap-3">
                                                        {AVATARS.map((avatar, i) => (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                onClick={() => setSelectedAvatar(avatar)}
                                                                className={cn(
                                                                    "w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110",
                                                                    selectedAvatar === avatar ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                                                                )}
                                                            >
                                                                <img src={avatar} alt={`Avatar ${i}`} className="w-full h-full" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Name Input */}
                                                <div className="space-y-2 max-w-md">
                                                    <Label htmlFor="full_name">Display Name</Label>
                                                    <Input
                                                        id="full_name"
                                                        placeholder="Your Name"
                                                        {...register("full_name")}
                                                    />
                                                </div>

                                                {/* Headline Input */}
                                                <div className="space-y-2 max-w-md">
                                                    <Label htmlFor="headline">Professional Headline</Label>
                                                    <Input
                                                        id="headline"
                                                        placeholder="e.g. 3rd Year B.Tech | Aspiring Frontend Developer"
                                                        {...register("headline")}
                                                    />
                                                    <p className="text-xs text-muted-foreground">A short tagline that appears under your name.</p>
                                                </div>

                                                {/* Bio */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="bio">About Me</Label>
                                                    <Textarea
                                                        id="bio"
                                                        placeholder="Tell us about yourself..."
                                                        className="min-h-[100px]"
                                                        {...register("bio")}
                                                    />
                                                    <p className="text-xs text-muted-foreground">Share your interests and goals.</p>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="bg-secondary/10 flex justify-end py-4">
                                                <Button type="submit" variant="gradient" disabled={isSaving}>
                                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                    Save Changes
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </TabsContent>

                                    {/* ACADEMIC TAB */}
                                    <TabsContent value="academic" className="space-y-6 mt-0">
                                        <Card className="border-border/50 shadow-sm">
                                            <CardHeader>
                                                <CardTitle>Academic Information</CardTitle>
                                                <CardDescription>Used to personalize your feed and recommendations.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="college">College / University</Label>
                                                        <div className="relative">
                                                            <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground z-10" />
                                                            <Input 
                                                                className="pl-9"
                                                                placeholder="Type or search your college..."
                                                                value={watch("college") || ""}
                                                                onChange={(e) => {
                                                                    setValue("college", e.target.value);
                                                                    if (!openCollege) setOpenCollege(true);
                                                                }}
                                                                onFocus={() => { if (watch("college")) setOpenCollege(true); }}
                                                                onBlur={() => setTimeout(() => setOpenCollege(false), 200)}
                                                            />
                                                            {openCollege && watch("college") && (
                                                                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border shadow-md rounded-md z-50 overflow-hidden">
                                                                    <ul className="max-h-60 overflow-y-auto p-1 text-sm text-popover-foreground">
                                                                        {(() => {
                                                                            const search = (watch("college") || "").toLowerCase();
                                                                            const matches = collegesList.filter((c: string) => c.toLowerCase().includes(search)).slice(0, 50);
                                                                            
                                                                            if (matches.length === 0) {
                                                                                const typed = watch("college") || "";
                                                                                return (
                                                                                    <li 
                                                                                        className="px-3 py-2 flex items-center gap-2 hover:bg-primary/10 cursor-pointer rounded-sm text-primary font-medium"
                                                                                        onMouseDown={(e) => {
                                                                                            e.preventDefault();
                                                                                            setValue("college", typed);
                                                                                            setOpenCollege(false);
                                                                                        }}
                                                                                    >
                                                                                        <span className="text-primary font-bold text-base">+</span>
                                                                                        Add "{typed}" as my college
                                                                                    </li>
                                                                                );
                                                                            }
                                                                            
                                                                            return matches.map(c => (
                                                                                <li 
                                                                                    key={c} 
                                                                                    className="px-3 py-2 hover:bg-muted cursor-pointer rounded-sm"
                                                                                    onMouseDown={(e) => {
                                                                                        e.preventDefault(); // prevent input blur
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
                                                        <Label htmlFor="branch">Major / Branch</Label>
                                                        <div className="relative">
                                                            <BookOpen className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                            <Input className="pl-9" id="branch" placeholder="e.g. Computer Science" {...register("branch")} />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="semester">Current Semester</Label>
                                                        <Select
                                                            onValueChange={(val) => setValue("semester", val)}
                                                            defaultValue={profile?.semester || ""}
                                                            value={watch("semester")}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Semester" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"].map((sem) => (
                                                                    <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="graduation_year">Graduation Year</Label>
                                                        <Select
                                                            onValueChange={(val) => setValue("graduation_year", val)}
                                                            defaultValue={profile?.graduation_year || ""}
                                                            value={watch("graduation_year")}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Year" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {["2024", "2025", "2026", "2027", "2028"].map((year) => (
                                                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="bg-secondary/10 flex justify-end py-4">
                                                <Button type="submit" variant="gradient" disabled={isSaving}>
                                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                    Save Changes
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </TabsContent>

                                    {/* PROFESSIONAL TAB */}
                                    <TabsContent value="professional" className="space-y-6 mt-0">
                                        <Card className="border-border/50 shadow-sm">
                                            <CardHeader>
                                                <CardTitle>Professional Profile</CardTitle>
                                                <CardDescription>Showcase your skills and online presence like a pro.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">

                                                {/* Current Role */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="current_position">Current Role / Experience</Label>
                                                    <div className="relative">
                                                        <Briefcase className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                        <Input className="pl-9" id="current_position" placeholder="e.g. Intern at Google, Tech Lead at GDSC" {...register("current_position")} />
                                                    </div>
                                                </div>

                                                {/* Skills */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="skills">Key Skills</Label>
                                                    <div className="relative">
                                                        <Briefcase className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                        <Input className="pl-9" id="skills" placeholder="e.g. React, Python, UI/UX Design (comma separated)" {...register("skills")} />
                                                    </div>
                                                </div>

                                                {/* Interests */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="interests">Interests</Label>
                                                    <div className="relative">
                                                        <Briefcase className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                        <Input className="pl-9" id="interests" placeholder="e.g. Product Management, Web3, AI (comma separated)" {...register("interests")} />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">What fields are you looking to explore or get hired in?</p>
                                                </div>

                                                {/* Spoken Languages */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="spoken_languages">Spoken Languages</Label>
                                                    <div className="relative">
                                                        <Briefcase className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                        <Input className="pl-9" id="spoken_languages" placeholder="e.g. English, Hindi, Spanish (comma separated)" {...register("spoken_languages")} />
                                                    </div>
                                                </div>

                                                {/* Social Links */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="linkedin">LinkedIn URL</Label>
                                                        <div className="relative">
                                                            <Linkedin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                            <Input className="pl-9" id="linkedin" placeholder="https://linkedin.com/in/username" {...register("linkedin")} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="github">GitHub URL</Label>
                                                        <div className="relative">
                                                            <Github className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                            <Input className="pl-9" id="github" placeholder="https://github.com/username" {...register("github")} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="portfolio">Portfolio / Website</Label>
                                                        <div className="relative">
                                                            <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                            <Input className="pl-9" id="portfolio" placeholder="https://myportfolio.com" {...register("portfolio")} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="resume_link">Resume / CV Link</Label>
                                                        <div className="relative">
                                                            <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                            <Input className="pl-9" id="resume_link" placeholder="Google Drive Link to PDF" {...register("resume_link")} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="bg-secondary/10 flex justify-end py-4">
                                                <Button type="submit" variant="gradient" disabled={isSaving}>
                                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                    Save Changes
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </TabsContent>

                                    {/* THEME TAB */}
                                    <TabsContent value="theme" className="space-y-6 mt-0">
                                        <Card className="border-border/50 shadow-sm">
                                            <CardHeader>
                                                <CardTitle>Appearance</CardTitle>
                                                <CardDescription>Customize the look and feel of the application.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                                                    <div className="space-y-0.5">
                                                        <Label className="text-base">Theme Mode</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Select your preferred theme (Light, Dark, or System).
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <ModeToggle />
                                                        <span className="text-sm font-medium">Toggle Theme</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* ACCOUNT TAB (Account Settings) */}
                                    <TabsContent value="account" className="space-y-6 mt-0">
                                        <Card className="border-border/50 shadow-sm">
                                            <CardHeader>
                                                <CardTitle>Account Settings</CardTitle>
                                                <CardDescription>Manage your sign-in details and privacy.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="space-y-2">
                                                    <Label>Email Address</Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                        <Input className="pl-9 bg-secondary/50" value={session.user.email} disabled />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Email cannot be changed manually.</p>
                                                </div>

                                                <div className="space-y-4 pt-4 border-t border-border">
                                                    <h4 className="font-medium flex items-center gap-2">
                                                        <Shield className="w-4 h-4" /> Change Password
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="new-password">New Password</Label>
                                                            <Input
                                                                id="new-password"
                                                                type="password"
                                                                placeholder="Min 6 characters"
                                                                onChange={(e) => setValue("password_new", e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="confirm-password">Confirm Password</Label>
                                                            <Input
                                                                id="confirm-password"
                                                                type="password"
                                                                placeholder="Re-enter password"
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
                                                    >
                                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                        Update Password
                                                    </Button>
                                                </div>

                                                <div className="border-t border-border pt-6 mt-6">
                                                    <h4 className="font-semibold text-destructive mb-4">Danger Zone</h4>
                                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                                                        <div>
                                                            <p className="font-medium">Sign Out</p>
                                                            <p className="text-xs text-muted-foreground">Securely log out of this device.</p>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            className="border-destructive/50 text-destructive hover:bg-destructive/10"
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
