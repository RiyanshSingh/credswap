import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { SEO } from "@/components/SEO";

const CommunityCardSkeleton = () => (
    <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="h-28 bg-muted animate-pulse" />
        <CardContent className="pt-0 -mt-10 relative px-6 pb-6 space-y-4">
            <Skeleton className="h-20 w-20 rounded-2xl" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="pt-4 border-t flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
            </div>
        </CardContent>
    </Card>
);

export default function Community() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: communities, isLoading } = useQuery({
        queryKey: ['communities'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('communities')
                .select('*, community_members(count)')
                .order('members_count', { ascending: false });

            if (error) console.error(error);

            // Use the database members_count as primary but fallback to joined count if higher or if we want real-time accuracy.
            // Actually, we should trust the column for sorting and display it.
            return data?.map((c: any) => ({
                ...c,
                members_count: c.members_count || (c.community_members?.[0]?.count || 0)
            })) || [];
        }
    });

    const filteredCommunities = communities?.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const colleges = filteredCommunities?.filter(c => c.type === 'college') || [];
    const clubs = filteredCommunities?.filter(c => c.type === 'club') || [];

    return (
        <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#050505] pb-24">
            <Navbar />
            <SEO title="Communities - CredSwap" description="Connect with fellow students in your college and clubs." />

            {/* Hero Section */}
            <section className="relative pt-20 pb-16 overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 -z-10" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 -z-10" />
                {/* Animated Orbs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse delay-1000" />

                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-md border border-border/50 text-sm font-medium text-muted-foreground mb-8 hover:bg-background/80 transition-colors">
                        <Users className="w-4 h-4 text-primary" />
                        <span>Join {communities?.length || 0} Communities</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">
                        Where Students <br className="hidden md:block" />
                        <span className="gradient-text">Connect & Collaborate</span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        Find your tribe. Join college groups, specialized clubs, and interest-based communities to grow together.
                    </p>

                    <div className="max-w-xl mx-auto relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 blur-sm"></div>
                        <div className="relative flex items-center bg-background rounded-lg shadow-xl">
                            <Search className="absolute left-4 text-muted-foreground w-5 h-5 group-hover:text-primary transition-colors" />
                            <Input
                                placeholder="Search for colleges, clubs, or topics..."
                                className="pl-12 h-14 bg-transparent border-none focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="container mx-auto px-4 -mt-12 relative z-20">
                <Tabs defaultValue="colleges" className="space-y-8">
                    <div className="flex justify-center">
                        <TabsList className="bg-background/80 backdrop-blur-xl border border-border/50 p-1.5 rounded-full h-auto shadow-lg">
                            <TabsTrigger value="colleges" className="rounded-full px-4 sm:px-8 py-2.5 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Colleges</TabsTrigger>
                            <TabsTrigger value="clubs" className="rounded-full px-4 sm:px-8 py-2.5 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Clubs & Societies</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="colleges" className="animate-in fade-in-50 slide-in-from-bottom-8 duration-700">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isLoading ? (
                                Array(6).fill(0).map((_, i) => <CommunityCardSkeleton key={i} />)
                            ) : (
                                <>
                                    {colleges.map((college) => (
                                        <CommunityCard key={college.id} community={college} navigate={navigate} />
                                    ))}
                                    {colleges.length === 0 && (
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                                <Search className="w-8 h-8 opacity-50" />
                                            </div>
                                            <p className="text-lg font-medium">No colleges found</p>
                                            <p className="text-sm">Try adjusting your search terms</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="clubs" className="animate-in fade-in-50 slide-in-from-bottom-8 duration-700">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isLoading ? (
                                Array(6).fill(0).map((_, i) => <CommunityCardSkeleton key={i} />)
                            ) : (
                                <>
                                    {clubs.map((club) => (
                                        <CommunityCard key={club.id} community={club} navigate={navigate} />
                                    ))}
                                    {clubs.length === 0 && (
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                                <Search className="w-8 h-8 opacity-50" />
                                            </div>
                                            <p className="text-lg font-medium">No clubs found</p>
                                            <p className="text-sm">Try adjusting your search terms</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </section>
            <MobileNav />
        </div>
    );
}

function CommunityCard({ community, navigate }: { community: any, navigate: any }) {
    // Generate a deterministed gradient based on name length
    const gradients = [
        "from-blue-500/20 to-cyan-500/20 text-blue-500",
        "from-purple-500/20 to-pink-500/20 text-purple-500",
        "from-amber-500/20 to-orange-500/20 text-amber-500",
        "from-green-500/20 to-emerald-500/20 text-green-500",
        "from-rose-500/20 to-red-500/20 text-rose-500",
    ];
    const gradientIndex = community.name.length % gradients.length;
    const theme = gradients[gradientIndex];

    return (
        <Card
            className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer bg-card/50 backdrop-blur-sm"
            onClick={() => navigate(`/community/${community.id}`)}
        >
            {/* Abstract Header Pattern */}
            <div className={`h-28 bg-gradient-to-r ${theme.split(" ")[0]} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                {/* Decorative Glow */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-50" />

                <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur-md shadow-sm border-0 font-medium px-3 py-1">
                        {community.members_count} Members
                    </Badge>
                </div>
            </div>

            <CardContent className="pt-0 -mt-10 relative px-6 pb-6">
                <div className={`h-20 w-20 rounded-2xl bg-background shadow-xl flex items-center justify-center border border-border/50 mb-4 ${theme.split(" ")[2]} group-hover:scale-105 transition-transform duration-500`}>
                    {community.type === 'college' ? <MapPin className="w-8 h-8" /> : <Users className="w-8 h-8" />}
                </div>

                <div className="space-y-3">
                    <h3 className="font-display font-bold text-xl leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[56px] flex items-center">
                        {community.name}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed h-[40px]">
                        {community.description}
                    </p>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-4 opacity-80 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                        {community.type} Group
                    </span>
                    <Button size="sm" variant="ghost" className="text-primary font-semibold hover:text-primary hover:bg-primary/5 -mr-2 group-hover:translate-x-1 transition-all">
                        Join Community <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
