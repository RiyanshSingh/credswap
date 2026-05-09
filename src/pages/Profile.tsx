import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building, BookOpen, GraduationCap, MapPin, Linkedin, Github, Globe, FileText, User, Mail, Share2, Calendar, ShoppingBag, ShieldCheck, Briefcase } from "lucide-react";
import { ItemCard } from "@/components/marketplace/ItemCard";
import { useToast } from "@/components/ui/use-toast";

export default function Profile() {
    const { id } = useParams();
    const location = useLocation();
    const { toast } = useToast();
    const [sessionUserId, setSessionUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSessionUserId(data.session?.user?.id || null));
    }, []);

    // If no ID is provided in URL, try to redirect to self or show error? 
    // Usually /profile view requires an ID. If user goes to /profile, maybe redirect to /profile/self_id?
    // For now, checks if ID exists.

    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['public-profile', id],
        enabled: !!id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        }
    });

    const { data: listings } = useQuery({
        queryKey: ['profile-listings', id],
        enabled: !!id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('marketplace_items')
                .select('*, profiles(*)')
                .eq('seller_id', id)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background pb-20">
                <Navbar />
                {/* Banner Skeleton */}
                <div className="w-full bg-gradient-to-b from-primary/5 to-background border-b border-border/50 pt-20 pb-12">
                    <div className="container max-w-5xl mx-auto px-4">
                        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 relative">
                            <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-full shrink-0" />
                            <div className="flex-1 space-y-4 mb-2 w-full">
                                <Skeleton className="h-10 w-1/3" />
                                <Skeleton className="h-6 w-1/2" />
                                <div className="flex gap-4 pt-2">
                                    <Skeleton className="h-6 w-24" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column Skeletons */}
                    <div className="space-y-6">
                        <Skeleton className="h-64 w-full rounded-xl" />
                        <Skeleton className="h-48 w-full rounded-xl" />
                    </div>
                    {/* Right Column Skeletons */}
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-64 w-full rounded-xl" />
                        <Skeleton className="h-48 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container flex flex-col items-center justify-center flex-1 h-[80vh]">
                    <User className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h2 className="text-2xl font-bold font-display">User Not Found</h2>
                    <p className="text-muted-foreground mt-2">The profile you are looking for does not exist.</p>
                    <Link to="/">
                        <Button className="mt-6">Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isOwnProfile = sessionUserId === profile.id;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            {/* Banner / Header Area */}
            <div className="w-full bg-gradient-to-b from-primary/5 to-background border-b border-border/50 pt-20 pb-12">
                <div className="container max-w-5xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6 relative">
                        {/* Avatar */}
                        <div className="border-4 border-background rounded-full p-1 bg-background shadow-xl -mt-0 md:-mt-0">
                            <Avatar className="w-32 h-32 md:w-40 md:h-40">
                                <AvatarImage src={profile.avatar_url} className="object-cover" />
                                <AvatarFallback className="text-4xl bg-primary/10 text-primary">{profile.full_name?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 space-y-2 mb-2">
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground">{profile.full_name || "Campus Student"}</h1>
                                {(listings && listings.length > 0) && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 gap-1 px-2 py-0.5 border-blue-200">
                                        <ShieldCheck className="w-3 h-3" /> Verified Seller
                                    </Badge>
                                )}
                            </div>
                            <div className="space-y-1">
                                {profile.headline && (
                                    <p className="text-xl text-primary font-medium">{profile.headline}</p>
                                )}
                                {profile.current_position && (
                                    <p className="text-md text-muted-foreground font-medium flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4" /> {profile.current_position}
                                    </p>
                                )}
                                {!profile.headline && !profile.current_position && (
                                    <p className="text-lg text-muted-foreground font-medium">Student at Campus Connect</p>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                                {profile.college && (
                                    <span className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                                        <Building className="w-3.5 h-3.5" /> {profile.college}
                                    </span>
                                )}
                                {profile.branch && (
                                    <span className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                                        <BookOpen className="w-3.5 h-3.5" /> {profile.branch}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> Joined {new Date(profile.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            {isOwnProfile ? (
                                <Link to="/settings" state={{ from: location.pathname }}>
                                    <Button variant="outline">Edit Profile</Button>
                                </Link>
                            ) : (
                                <Button onClick={() => {
                                    window.location.href = `mailto:${profile.email || ''}`;
                                }}>
                                    <Mail className="w-4 h-4 mr-2" /> Message
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast({ title: "Link Copied", description: "Profile link copied to clipboard." });
                            }}>
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Column: Details */}
                <div className="space-y-6">
                    {/* Connect Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Connect</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {profile.linkedin && (
                                <a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-[#0077b5] transition-colors p-2 hover:bg-secondary/50 rounded-lg">
                                    <Linkedin className="w-5 h-5" />
                                    <span className="font-medium">LinkedIn</span>
                                </a>
                            )}
                            {profile.github && (
                                <a href={profile.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-secondary/50 rounded-lg">
                                    <Github className="w-5 h-5" />
                                    <span className="font-medium">GitHub</span>
                                </a>
                            )}
                            {profile.portfolio && (
                                <a href={profile.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-secondary/50 rounded-lg">
                                    <Globe className="w-5 h-5" />
                                    <span className="font-medium">Website</span>
                                </a>
                            )}
                            {profile.resume_link && (
                                <a href={profile.resume_link} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-secondary/50 rounded-lg">
                                    <FileText className="w-5 h-5" />
                                    <span className="font-medium">Resume</span>
                                </a>
                            )}

                            {!profile.linkedin && !profile.github && !profile.portfolio && (
                                <p className="text-sm text-muted-foreground italic">No social links added.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Academic Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Academics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Semester</p>
                                <p className="text-base font-medium">{profile.semester || "Not set"}</p>
                            </div>
                            {profile.graduation_year && (
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Graduation Year</p>
                                    <p className="text-base font-medium">{profile.graduation_year}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Branch</p>
                                <p className="text-base font-medium">{profile.branch || "Not set"}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Main Info */}
                <div className="md:col-span-2 space-y-6">
                    {/* Bio / About */}
                    <Card>
                        <CardHeader>
                            <CardTitle>About Me</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {profile.bio ? (
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{profile.bio}</p>
                            ) : (
                                <p className="text-muted-foreground/50 italic">This user hasn't written a bio yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Skills */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Skills & Expertise</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {profile.skills ? (
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.split(',').map((skill: string) => (
                                        <Badge key={skill} variant="secondary" className="px-3 py-1 text-sm font-medium">
                                            {skill.trim()}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground/50 italic">No skills listed.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Interests & Languages */}
                    {(profile.interests || profile.spoken_languages) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>More About Me</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {profile.interests && profile.interests.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Interests</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.interests.map((interest: string) => (
                                                <Badge key={interest} variant="outline" className="px-3 py-1 text-sm bg-background">
                                                    {interest}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {profile.spoken_languages && profile.spoken_languages.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Languages</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.spoken_languages.map((language: string) => (
                                                <Badge key={language} variant="secondary" className="px-3 py-1 text-sm">
                                                    {language}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Stats? Actions? Could add Recent Activity here later */}
                </div>
            </div>


            {/* Active Listings Section */}
            {
                (listings && listings.length > 0) && (
                    <div className="container max-w-5xl mx-auto px-4 pb-16">
                        <div className="flex items-center gap-2 mb-6 border-t border-border/50 pt-8">
                            <ShoppingBag className="w-6 h-6 text-primary" />
                            <h2 className="text-2xl font-bold font-display">Active Listings by {profile.full_name?.split(' ')[0]}</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {listings.map((item) => (
                                <ItemCard
                                    key={item.id}
                                    item={item}
                                    isOwner={isOwnProfile}
                                    isLoggedIn={!!sessionUserId}
                                    onStatusChange={() => { }} // Read-only view for visitors, owner uses Dashboard
                                    onDelete={() => { }}
                                    onEdit={() => { }}
                                />
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
