import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Briefcase, MapPin, GraduationCap, Github, Linkedin, Globe, Mail, Code, CalendarDays, ExternalLink, User, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface ChatProfileDialogProps {
    userId: string | undefined;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChatProfileDialog({ userId, open, onOpenChange }: ChatProfileDialogProps) {
    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile', userId],
        enabled: !!userId && open,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) throw error;
            return data;
        }
    });

    if (!userId) return null;

    const getGradient = (name: string) => {
        const colors = [
            "from-blue-600 to-indigo-700",
            "from-rose-500 to-pink-600",
            "from-violet-600 to-purple-600",
            "from-emerald-500 to-teal-600",
            "from-amber-500 to-orange-600"
        ];
        const index = name ? name.length % colors.length : 0;
        return `bg-gradient-to-r ${colors[index]}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl bg-card/95 backdrop-blur-xl">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground animate-pulse">Loading profile...</p>
                    </div>
                ) : profile ? (
                    <div className="relative flex flex-col w-full max-h-[85vh] overflow-y-auto custom-scrollbar">
                        {/* Cover Banner with Motion Dots */}
                        <div className={`h-32 w-full ${getGradient(profile.full_name)} relative shrink-0 overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/10" />

                            {/* Motion Glowing Blobs */}
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute bg-white/30 blur-lg"
                                    initial={{
                                        x: Math.random() * 400 - 200,
                                        y: Math.random() * 100 - 50,
                                        opacity: 0,
                                        scale: 0.5,
                                        borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%"
                                    }}
                                    animate={{
                                        x: [Math.random() * 400 - 200, Math.random() * 400 - 200],
                                        y: [Math.random() * 128, Math.random() * 128],
                                        opacity: [0.3, 0.6, 0.3],
                                        scale: [0.8, 1.5, 0.8],
                                        borderRadius: [
                                            "30% 70% 70% 30% / 30% 30% 70% 70%",
                                            "50% 50% 50% 50% / 50% 50% 50% 50%",
                                            "70% 30% 30% 70% / 70% 70% 30% 30%"
                                        ]
                                    }}
                                    transition={{
                                        duration: 15 + Math.random() * 10,
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                        ease: "easeInOut"
                                    }}
                                    style={{
                                        width: Math.random() * 50 + 30, // Bigger
                                        height: Math.random() * 50 + 30,
                                        top: `${Math.random() * 100}%`,
                                        left: `${Math.random() * 100}%`
                                    }}
                                />
                            ))}
                        </div>

                        {/* Profile Header Content */}
                        <div className="px-6 flex flex-col items-center -mt-12 mb-6 relative z-10">
                            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                                <AvatarImage src={profile.avatar_url} className="object-cover" />
                                <AvatarFallback className="text-3xl font-bold bg-secondary text-secondary-foreground">
                                    {profile.full_name?.[0]}
                                </AvatarFallback>
                            </Avatar>

                            <div className="text-center mt-3 space-y-1">
                                <h2 className="text-2xl font-bold tracking-tight">{profile.full_name}</h2>
                                {profile.headline && (
                                    <p className="text-sm font-medium text-primary/90">{profile.headline}</p>
                                )}
                            </div>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="px-6 pb-8 space-y-4">

                            {/* About Box */}
                            {profile.bio && (
                                <div className="bg-secondary/40 rounded-xl p-4 border border-border/50">
                                    <div className="flex items-center gap-2 mb-2 text-primary font-semibold text-sm">
                                        <User className="w-4 h-4" /> About
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {profile.bio}
                                    </p>
                                </div>
                            )}

                            {/* Academics Box */}
                            {(profile.college || profile.branch || profile.semester) && (
                                <div className="bg-secondary/40 rounded-xl p-4 border border-border/50">
                                    <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm">
                                        <GraduationCap className="w-4 h-4" /> Academics
                                    </div>
                                    <div className="space-y-3">
                                        {profile.college && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-background p-1.5 rounded-md shadow-sm">
                                                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{profile.college}</p>
                                                    <p className="text-xs text-muted-foreground">College</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex gap-3">
                                            {profile.branch && (
                                                <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-md shadow-sm border border-border/50">
                                                    <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="text-sm">{profile.branch}</span>
                                                </div>
                                            )}
                                            {profile.semester && (
                                                <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-md shadow-sm border border-border/50">
                                                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="text-sm">{profile.semester}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Skills Box */}
                            {profile.skills && (
                                <div className="bg-secondary/40 rounded-xl p-4 border border-border/50">
                                    <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm">
                                        <Code className="w-4 h-4" /> Skills
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills.split(',').map((skill: string, i: number) => (
                                            <Badge key={i} variant="outline" className="bg-background hover:bg-background/80 px-2.5 py-1 text-xs border-primary/20">
                                                {skill.trim()}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Socials Box */}
                            {(profile.github || profile.linkedin || profile.portfolio) && (
                                <div className="bg-secondary/40 rounded-xl p-4 border border-border/50">
                                    <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm">
                                        <Globe className="w-4 h-4" /> Connect
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {profile.github && (
                                            <Button variant="outline" className="w-full bg-background justify-start" asChild>
                                                <a href={profile.github} target="_blank" rel="noreferrer">
                                                    <Github className="w-4 h-4 mr-2" /> GitHub
                                                </a>
                                            </Button>
                                        )}
                                        {profile.linkedin && (
                                            <Button variant="outline" className="w-full bg-background justify-start" asChild>
                                                <a href={profile.linkedin} target="_blank" rel="noreferrer">
                                                    <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                                                </a>
                                            </Button>
                                        )}
                                        {profile.portfolio && (
                                            <Button variant="outline" className="w-full bg-background col-span-2 justify-center" asChild>
                                                <a href={profile.portfolio} target="_blank" rel="noreferrer">
                                                    <ExternalLink className="w-4 h-4 mr-2" /> Portfolio
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-muted-foreground">User not found</div>
                )}
            </DialogContent>
        </Dialog>
    );
}
