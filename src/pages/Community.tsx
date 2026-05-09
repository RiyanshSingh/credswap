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
    <Card className="overflow-hidden bg-[#0a0a0a] border-white/10">
        <div className="h-28 bg-[#111] animate-pulse" />
        <CardContent className="pt-0 -mt-10 relative px-6 pb-6 space-y-4">
            <Skeleton className="h-16 w-16 rounded-2xl bg-white/5" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-3/4 bg-white/5" />
                <Skeleton className="h-4 w-full bg-white/5" />
                <Skeleton className="h-4 w-2/3 bg-white/5" />
            </div>
            <div className="pt-4 border-t border-white/10 flex justify-between">
                <Skeleton className="h-4 w-20 bg-white/5" />
                <Skeleton className="h-8 w-24 bg-white/5" />
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
        <div className="min-h-screen bg-black flex flex-col selection:bg-white selection:text-black pb-24">
            <Navbar />
            <SEO title="Communities - CredSwap" description="Connect with fellow students in your college and clubs." />

            {/* Premium Monochrome Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[50%] h-[50%] bg-white/[0.03] blur-[150px] rounded-full animate-aurora" />
                <div className="absolute bottom-0 right-1/4 w-[40%] h-[40%] bg-white/[0.02] blur-[130px] rounded-full animate-float" />
            </div>

            {/* Hero Section */}
            <section className="relative pt-28 pb-16 overflow-hidden z-10">
                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-8 hover:bg-white/10 transition-colors">
                        <Users className="w-3.5 h-3.5 text-white" />
                        <span>{communities?.length || 0} Active Communities</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight text-white leading-tight">
                        The CredSwap <br className="hidden md:block" />
                        <span className="text-white/60">Community</span>
                    </h1>

                    <p className="text-xs text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed font-bold tracking-widest uppercase">
                        Find your tribe. Join college groups, specialized clubs, and interest-based communities to grow together.
                    </p>

                    <div className="max-w-xl mx-auto relative group">
                        <div className="relative flex items-center bg-[#0a0a0a]/80 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl">
                            <Search className="absolute left-5 text-zinc-500 w-5 h-5 group-hover:text-white transition-colors" />
                            <Input
                                placeholder="Search for colleges, clubs, or topics..."
                                className="pl-14 h-16 bg-transparent border-none focus-visible:ring-0 text-white font-bold placeholder:text-zinc-700"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="container mx-auto px-4 relative z-20">
                <Tabs defaultValue="colleges" className="space-y-8">
                    <div className="flex justify-center">
                        <TabsList className="bg-white/5 backdrop-blur-xl border border-white/10 p-1 rounded-full h-14 shadow-lg">
                            <TabsTrigger value="colleges" className="h-full rounded-full px-6 sm:px-10 font-black uppercase tracking-widest text-[10px] text-zinc-500 transition-all data-[state=active]:bg-white data-[state=active]:text-black hover:text-white">Colleges</TabsTrigger>
                            <TabsTrigger value="clubs" className="h-full rounded-full px-6 sm:px-10 font-black uppercase tracking-widest text-[10px] text-zinc-500 transition-all data-[state=active]:bg-white data-[state=active]:text-black hover:text-white">Clubs & Societies</TabsTrigger>
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
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
                                            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4">
                                                <Search className="w-6 h-6 text-zinc-400" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest text-white mb-2">No colleges found</p>
                                            <p className="text-xs font-bold text-zinc-500">Try adjusting your search terms</p>
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
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
                                            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4">
                                                <Search className="w-6 h-6 text-zinc-400" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest text-white mb-2">No clubs found</p>
                                            <p className="text-xs font-bold text-zinc-500">Try adjusting your search terms</p>
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
    return (
        <Card
            className="group relative overflow-hidden bg-[#0a0a0a] border-white/10 hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
            onClick={() => navigate(`/community/${community.id}`)}
        >
            {/* Abstract Header Pattern */}
            <div className="h-28 bg-[#111] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

                <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-white/10 text-white backdrop-blur-md border-0 font-bold px-3 py-1 text-[10px] uppercase tracking-widest">
                        {community.members_count} Members
                    </Badge>
                </div>
            </div>

            <CardContent className="pt-0 -mt-8 relative px-6 pb-6">
                <div className="h-14 w-14 rounded-2xl bg-black flex items-center justify-center border border-white/10 mb-4 text-white group-hover:scale-105 group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-xl">
                    {community.type === 'college' ? <MapPin className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                </div>

                <div className="space-y-2">
                    <h3 className="font-display font-bold text-lg leading-tight text-white group-hover:text-zinc-300 transition-colors line-clamp-2 min-h-[48px] flex items-center">
                        {community.name}
                    </h3>
                    <p className="text-zinc-500 text-sm font-medium line-clamp-2 leading-relaxed h-[40px]">
                        {community.description}
                    </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 opacity-80 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                        {community.type}
                    </span>
                    <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black hover:bg-white -mr-2 group-hover:translate-x-1 transition-all rounded-xl h-9 px-4">
                        Join Now <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
