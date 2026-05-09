/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Session } from "@supabase/supabase-js";
import { Note, Event as DbEvent, MarketplaceItem, Room, Profile } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { MobileNav } from "@/components/MobileNav";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  User,
  BookOpen,
  Calendar,
  Coins,
  Download,
  Upload,
  Camera,
  Star,
  TrendingUp,
  Settings,
  Edit,
  Bell,
  Wallet,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ChevronRight,
  Award,
  LogOut,
  Linkedin,
  Github,
  Globe,
  History,
  ShoppingBag,
  ShoppingCart,
  MessageCircle,
  Trash,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Ticket,
  BedDouble, // [NEW]
  Briefcase,
  Plus,
  QrCode,
  ClipboardCheck
} from "lucide-react";
import { RoomCard } from "@/components/rooms/RoomCard"; // [NEW]
import { cn } from "@/lib/utils";
import { logActivity } from "@/lib/activityLogger";
import { ItemCard } from "@/components/marketplace/ItemCard";
import { EditItemDialog } from "@/components/marketplace/EditItemDialog";
import { motion } from "framer-motion";
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

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Removed mock data import


import { Skeleton } from "@/components/ui/skeleton"; // [NEW]
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ModeToggle } from "@/components/ModeToggle"; // [NEW]

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#050505] pb-20 md:pb-0">
    <Navbar />
    <section className="relative pb-6">
      <div className="h-48 w-full bg-muted animate-pulse" />
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-card rounded-3xl border border-border/50 shadow-xl overflow-hidden p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            <Skeleton className="h-32 w-32 rounded-3xl shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-16 rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  // Sync Tab with URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val }, { preventScrollReset: true, replace: true });
  };
  const [isUploading, setIsUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingEvent, setEditingEvent] = useState<DbEvent | null>(null);
  const [managingEvent, setManagingEvent] = useState<DbEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: "default" | "destructive";
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => { },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session?.user?.id);

      if (updateError) {
        throw updateError;
      }

      toast({ title: "Avatar Updated", description: "Your profile picture has been updated." });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };



  // Fetch Session
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      console.log("Dashboard: Fetching session...");
      // Add manual timeout promise (Increased to 15s)
      const getSessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Session fetch timeout")), 15000));

      const { data, error } = await Promise.race([getSessionPromise, timeoutPromise]) as { data: { session: Session | null }, error: any };

      console.log("Dashboard: Session fetched", data?.session ? "Active" : "Null", error);
      if (error) throw error;
      return data?.session;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false,
  });

  // Fetch Profile (MOVED UP to avoid hook error)
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery<Profile | null>({
    queryKey: ['profile', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      console.log("Dashboard: Fetching profile for", session?.user?.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();

      console.log("Dashboard: Profile fetched", data, error);
      if (error) {
        console.error("Dashboard: Profile fetch error", error);
        // Don't throw if just missing, maybe return null?
        // But for debugging let's see.
        throw error;
      }
      return data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Fetch Opportunity Applications Count
  const { data: applicationsCount = 0 } = useQuery<number>({
    queryKey: ['opportunity-applications-count', session?.user?.id, session?.user?.email],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const filters: string[] = [];
      if (session?.user?.id) filters.push(`user_id.eq.${session.user.id}`);
      if (session?.user?.email) filters.push(`email.eq.${session.user.email}`);
      const query = supabase.from('opportunity_applications').select('id', { count: 'exact', head: true });
      const { count, error } = filters.length ? await query.or(filters.join(',')) : await query;
      if (error) {
        console.error("Error fetching applications count", error);
        return 0;
      }
      return count || 0;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Fetch My Opportunity Applications
  const { data: myApplications } = useQuery({
    queryKey: ['my-opportunity-applications', session?.user?.id, session?.user?.email],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const filters: string[] = [];
      if (session?.user?.id) filters.push(`user_id.eq.${session.user.id}`);
      if (session?.user?.email) filters.push(`email.eq.${session.user.email}`);
      const query = supabase
        .from('opportunity_applications')
        .select('*, opportunities(*)')
        .order('created_at', { ascending: false });
      const { data, error } = filters.length ? await query.or(filters.join(',')) : await query;
      if (error) {
        console.error("Error fetching applications", error);
        return [];
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Fetch Recent Activities
  const { data: activities, error: activitiesError } = useQuery<any[]>({
    queryKey: ['activities', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching activities", error);
        return [];
      }
      return data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Fetch User Uploads
  const { data: userUploads } = useQuery<Note[]>({
    queryKey: ['my-uploads', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching uploads", error);
        return [];
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });


  // Fetch Download History (Moved up to avoid conditional hook error)
  const { data: downloadHistoryRaw } = useQuery<any[]>({
    queryKey: ['my-downloads', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_downloads')
        .select('note_id, notes(*)')
        .eq('user_id', session?.user?.id)
        .order('downloaded_at', { ascending: false });

      if (error) {
        console.error("Error fetching downloads", error);
        return [];
      }
      return data || [];
    }
  });
  const downloadHistory = (downloadHistoryRaw as any)?.map((item: any) => Array.isArray(item.notes) ? item.notes[0] : item.notes) as Note[] || [];

  // Fetch My Sales
  const { data: mySales } = useQuery<any[]>({
    queryKey: ['my-sales', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select('*, marketplace_disputes(*)') // Fetch linked dispute
        .eq('seller_id', session?.user?.id);
      if (error) console.error("Error fetching sales", error);
      return data || [];
    }
  });

  // Calculate Levels & XP logic moved below

  const { data: myListingsRaw } = useQuery({
    queryKey: ['my-listings', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*, profiles!seller_id(*)')
        .eq('seller_id', session?.user?.id)
        .order('created_at', { ascending: false });
      if (error) console.error("Error fetching listings", error);
      return data || [];
    }
  });

  // Fetch My Rooms (NEW)
  const { data: myRooms } = useQuery({
    queryKey: ['my-rooms', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('owner_id', session?.user?.id)
        .order('created_at', { ascending: false });
      if (error) console.error("Error fetching rooms", error);
      return data || [];
    }
  });


  // Fetch Enrolled Roadmaps
  const { data: enrolledRoadmaps } = useQuery<any[]>({
    queryKey: ['my-enrolled-roadmaps', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const raw = localStorage.getItem(`enrolled-roadmaps-${session.user.id}`);
      if (!raw) return [];
      try {
        const enrolledIds: string[] = JSON.parse(raw);
        if (enrolledIds.length === 0) return [];
        const { data, error } = await supabase
          .from('roadmaps')
          .select('*')
          .in('id', enrolledIds);
        if (error) throw error;
        return data || [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch My Orders (Secure V2)
  const { data: myOrders } = useQuery({
    queryKey: ['my-orders', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select('*, marketplace_items(*, profiles!seller_id(*)), marketplace_disputes(*)') // Fetch item, seller, and dispute
        .eq('buyer_id', session?.user?.id)
        .order('created_at', { ascending: false });
      if (error) console.error("Error fetching orders", error);
      return data || [];
    }
  });

  // Fetch Joined Events
  const { data: joinedEventsRaw } = useQuery<any[]>({
    queryKey: ['my-event-registrations', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*, events(*)')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });
      if (error) console.error("Error fetching events", error);
      return data || [];
    }
  });
  // Map events but prioritize the REGISTRATION status for the dashboard view
  const joinedEvents = joinedEventsRaw?.map((r: any) => ({
    ...r.events,
    // IMPORTANT: status here refers to the USER'S registration status, not the event's global status
    status: r.status,
    registration_status: r.status, // KEEP THIS for badge compatibility
    event_status: r.events.status // Keep original event status if needed
  })) || [];

  // Fetch My Created Events (NEW)
  const { data: myCreatedEvents, refetch: refetchMyEvents } = useQuery({
    queryKey: ['my-created-events', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });
      if (error) console.error("Error fetching my events", error);
      return data || [];
    }
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-created-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: "Event Deleted", description: "Listing removed successfully." });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message || "Could not delete event.", variant: "destructive" })
  });

  const confirmDelivery = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.rpc('release_funds', { order_id: orderId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      toast({ title: "Delivery Confirmed", description: "Funds released to seller." });
    },
    onError: (error: any) => {
      console.error("Confirm Delivery Error:", error);
      toast({
        title: "Confirmation Failed",
        description: error.message || "Unknown error occurred",
        variant: "destructive"
      });
    }
  });

  // ... (skipping unchanged mutation definitions) ...



  // ... rest of component ...



  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await supabase.from('marketplace_items').select('status').eq('id', id).single();
      if (data?.status === 'reserved' || data?.status === 'sold') {
        throw new Error("Item is currently locked in an active order and cannot be deleted.");
      }
      const { error } = await supabase.from('marketplace_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
      toast({ title: "Listing Removed", description: "Item deleted successfully." });
    },
    onError: () => toast({ title: "Error", description: "Could not delete item.", variant: "destructive" })
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: "Room Removed", description: "Listing deleted successfully." });
    },
    onError: () => toast({ title: "Error", description: "Could not delete room.", variant: "destructive" })
  });

  const updateListingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase.from('marketplace_items').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
      toast({ title: "Status Updated", description: "Item status changed." });
    }
  });


  // Dispute Logic
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [selectedDisputeOrder, setSelectedDisputeOrder] = useState<any>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const deleteNoteRequest = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('notes')
        .update({ is_deletion_requested: true })
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Deletion Requested", description: "Admin will review your request." });
      queryClient.invalidateQueries({ queryKey: ['my-uploads'] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const raiseDispute = useMutation({
    mutationFn: async () => {
      if (!selectedDisputeOrder) return;

      const { error } = await supabase.from('marketplace_disputes').insert({
        order_id: selectedDisputeOrder.id,
        raised_by: session.user.id,
        reason: disputeReason,
        status: 'open'
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      toast({ title: "Dispute Raised", description: "Admin has been notified." });
      setIsDisputeOpen(false);
      setDisputeReason("");
      setSelectedDisputeOrder(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });


  // Effect to redirect
  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/auth");
    }
  }, [session, isLoading, navigate]);

  // Loading state (Session only)
  // We implement a timeout here. If it takes longer than 5 seconds, we show a retry button to avoid infinite spin.
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => setShowTimeout(true), 15000);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (profileError) {
    console.error("CRITICAL PROFILE ERROR:", profileError);
    return (
      <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#050505] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="text-destructive font-semibold text-xl">Account Not Found</div>
        <p className="text-muted-foreground text-sm max-w-md">
          It looks like your profile data is missing or was deleted from the database.
          Please sign out and register a new account to continue.
        </p>
        <div className="text-xs text-muted-foreground/50 pb-4 font-mono">Error details: {profileError.message}</div>
        <Button onClick={async () => {
          queryClient.clear();
          localStorage.clear();
          await supabase.auth.signOut().catch(() => { });
          window.location.href = '/auth';
        }} variant="default" size="lg">
          Force Sign Out
        </Button>
      </div>
    );
  }

  if (isLoading || isProfileLoading) {
    if (showTimeout && !isProfileLoading) {
      return (
        <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#050505] flex items-center justify-center flex-col gap-4">
          <div className="text-destructive font-semibold">Connection Timed Out</div>
          <p className="text-muted-foreground">We couldn't verify your session.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
          <Button onClick={async () => {
            localStorage.clear();
            await supabase.auth.signOut().catch(() => { });
            navigate("/auth");
          }} variant="ghost">
            Force Logout (Reset)
          </Button>
        </div>
      )
    }
    return <DashboardSkeleton />;
  }

  // Redirecting state
  if (!session) return null;

  // Safe User Data Construction
  const getUserData = () => {
    if (!profile) {
      return {
        id: session?.user?.id,
        name: session?.user?.user_metadata?.full_name || "Student",
        email: session?.user?.email || "",
        college: "Update Profile",
        branch: "General",
        semester: "Sem 1",
        avatar_url: undefined,
        joinedDate: "Today",
        stats: {
          downloads: downloadHistory?.length || 0,
          courses: enrolledRoadmaps?.length || 0,
          eventsJoined: 0,
          applications: applicationsCount || 0
        }
      };
    }
    return {
      id: profile.id,
      name: profile.full_name || "Student",
      email: profile.email || session?.user?.email || "",
      college: profile.college || "University",
      branch: profile.branch || "General",
      semester: profile.semester || "Sem 1",
      avatar_url: profile.avatar_url,
      bio: profile.bio || "",
      linkedin: profile.linkedin,
      github: profile.github,
      portfolio: profile.portfolio,
      resume_link: profile.resume_link,
      joinedDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "Today",
      stats: {
        downloads: downloadHistory?.length || 0,
        courses: enrolledRoadmaps?.length || 0,
        eventsJoined: joinedEvents?.length || 0,
        applications: applicationsCount || 0,
      }
    };
  };

  const userData = getUserData();

  const calculateProfileCompletion = () => {
    const fields = [
      profile?.full_name,
      profile?.avatar_url,
      profile?.college,
      profile?.branch,
      profile?.semester,
      profile?.bio,
      profile?.linkedin,
      profile?.github,
      profile?.portfolio,
      profile?.resume_link
    ];
    const filled = fields.filter(f => f && typeof f === 'string' ? f.trim() !== '' : !!f).length;
    return Math.round((filled / fields.length) * 100);
  };
  const profileCompletion = calculateProfileCompletion();

  // Calculate Levels & XP
  // Equal Contribution Ratio: 50 XP per action, Courses 100 XP
  const xp = ((userUploads?.length || 0) * 50) + (userData.stats.downloads * 50) + (userData.stats.eventsJoined * 50) + (userData.stats.courses * 100);

  let nextLevelXp = 500;
  let level = 1;
  let levelName = "Novice";

  if (xp >= 5000) { level = 5; levelName = "Campus Legend"; nextLevelXp = 10000; }
  else if (xp >= 3000) { level = 4; levelName = "Expert Contributor"; nextLevelXp = 5000; }
  else if (xp >= 1500) { level = 3; levelName = "Rising Star"; nextLevelXp = 3000; }
  else if (xp >= 500) { level = 2; levelName = "Active Member"; nextLevelXp = 1500; }

  const progress = Math.min(100, (xp / nextLevelXp) * 100);

  // Loading state
  // We allow profile loading to take a moment, but if session is loaded we can start showing skeleton or partial state.
  // For now, let's keep it simple but ensure we don't block indefinitely.
  console.log("Dashboard Render State:", { isLoading, isProfileLoading, hasSession: !!session, hasProfile: !!profile, profileError });

  const uploadedContent = userUploads || [];


  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-success/10 text-success border-success/20",
      pending: "bg-warning/10 text-warning border-warning/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
      completed: "bg-success/10 text-success border-success/20",
      in_progress: "bg-primary/10 text-primary border-primary/20",
      upcoming: "bg-primary/10 text-primary border-primary/20",
      attended: "bg-green-500/15 text-green-600 border-green-200",
    };
    return styles[status as keyof typeof styles] || "";
  };

  return (
    <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#050505] pb-20 md:pb-0">
      <SEO title="Student Dashboard" />
      <Navbar />

      <section className="relative pb-6">
        {/* Banner with Gradient & Motion */}
        <div className="h-48 w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-black/10"></div>

          {/* Motion Elements (Small & Visible) */}
          {/* Motion Elements (Small & Visible) - 100 Particles */}
          {[...Array(100)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * 100 - 50,
                y: Math.random() * 50 - 25,
                opacity: Math.random() * 0.5 + 0.3,
                scale: 0.5
              }}
              animate={{
                x: [Math.random() * 300 - 150, Math.random() * -300 + 150],
                y: [Math.random() * 100 - 50, Math.random() * -100 + 50],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 10 + Math.random() * 20,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              className={cn(
                "absolute rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]",
                i % 3 === 0 ? "w-1 h-1" : i % 2 === 0 ? "w-2 h-2" : "w-1.5 h-1.5"
              )}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 -mt-20 relative z-10">
          <div className="bg-card rounded-3xl border border-border/50 shadow-xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-10 relative">

              {/* Left: Avatar & quick Identity */}
              <div className="flex flex-col items-center md:items-start shrink-0">
                <div className="relative group">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    className="hidden"
                    accept="image/*"
                  />
                  
                  {/* Integrated Circular Progress Ring around Avatar */}
                  <div className="relative flex items-center justify-center">
                    {/* SVG Progress Ring */}
                    <div className="absolute -inset-2 md:-inset-2.5 z-0 pointer-events-none">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id="profile-progress" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#4f46e5" />
                          </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="48" stroke="currentColor" fill="none" strokeWidth="1.5" className="text-muted/20" />
                        <circle 
                          cx="50" cy="50" r="48" 
                          stroke="url(#profile-progress)" fill="none" strokeWidth="3" 
                          strokeLinecap="round"
                          strokeDasharray={`${(profileCompletion / 100) * 301.59}, 301.59`}
                          className="transition-all duration-1500 ease-out drop-shadow-sm" 
                        />
                      </svg>
                    </div>

                    {/* Main Avatar Container */}
                    <div
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-card bg-background shadow-lg overflow-hidden flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-primary/10 to-primary/5 text-primary relative cursor-pointer group z-10"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      )}

                      {userData.avatar_url ? (
                        <img src={userData.avatar_url} alt={userData.name} className="w-full h-full object-cover" />
                      ) : (
                        userData.name.split(" ").map((n) => n[0]).join("")
                      )}
                    </div>
                    
                    {/* Integrated Percentage Pill */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-card z-20 whitespace-nowrap">
                      {profileCompletion}% Complete
                    </div>
                  </div>
                </div>

                {/* Mobile XP Bar (visible on small screens below avatar) */}
                <div className="w-full mt-4 md:hidden">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-primary">{levelName}</span>
                    <span className="text-muted-foreground">{xp} / {nextLevelXp} XP</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>

              {/* Right: Info Grid */}
              <div className="flex-1 flex flex-col pt-2 md:pt-14">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                  <div className="w-full">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                        <Link to={`/profile/${userData.id}`}>{userData.name}</Link>
                      </h1>
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white shadow-sm px-3 py-1 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Level {level}
                      </Badge>
                    </div>

                    {/* Desktop XP Bar */}
                    <div className="hidden md:block max-w-sm mb-3">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-primary flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {levelName}</span>
                        <span className="text-muted-foreground">{xp} / {nextLevelXp} XP</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <p className="text-lg text-muted-foreground">{userData.email}</p>
                    {userData.bio && (
                      <p className="mt-3 text-foreground/80 max-w-2xl leading-relaxed">
                        {userData.bio}
                      </p>
                    )}
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2 absolute top-4 right-4 md:static md:self-start">

                    <Link to="/settings">
                      <Button variant="outline" size="sm" className="hidden md:flex gap-2">
                        <Settings className="w-4 h-4" /> Settings
                      </Button>
                    </Link>
                    <Link to="/settings" className="md:hidden">
                      <Button variant="ghost" size="icon">
                        <Settings className="w-5 h-5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setIsLogoutDialogOpen(true)}
                    >
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                  <AlertDialogContent className="w-[90%] max-w-[380px] rounded-3xl p-6">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You will be signed out of your account on this device.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async () => {
                          await logActivity(session.user.id, "Logged Out", "User manually logged out");
                          queryClient.clear();
                          await supabase.auth.signOut();
                          navigate("/");
                        }}
                      >
                        Sign Out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="h-px bg-border/60 w-full my-6"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Academic Info */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Academic Info
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium min-w-[80px]">College:</span>
                        <span className="text-foreground">{userData.college}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium min-w-[80px]">Branch:</span>
                        <span>{userData.branch}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium min-w-[80px]">Semester:</span>
                        <span>{userData.semester}</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4" /> Skills & Interests
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile?.skills ? (
                        profile.skills.split(',').map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 px-3 py-1">
                            {skill.trim()}
                          </Badge>
                        ))
                      ) : (
                        <Link to="/settings" className="text-sm text-primary hover:underline flex items-center gap-1 opacity-70">
                          Add skills to profile <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Socials */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Connect
                    </h4>
                    <div className="flex gap-3">
                      {userData.linkedin ? (
                        <a href={userData.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                          <Linkedin className="w-5 h-5 fill-current" />
                        </a>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-400 dark:text-blue-700 select-none cursor-not-allowed" title="No LinkedIn added">
                          <Linkedin className="w-5 h-5" />
                        </div>
                      )}

                      {userData.github ? (
                        <a href={userData.github} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-zinc-900 text-white hover:bg-black hover:scale-105 hover:shadow-lg hover:shadow-zinc-500/20 transition-all duration-300">
                          <Github className="w-5 h-5 fill-current" />
                        </a>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 select-none cursor-not-allowed" title="No GitHub added">
                          <Github className="w-5 h-5" />
                        </div>
                      )}

                      {userData.portfolio ? (
                        <a href={userData.portfolio} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white hover:opacity-90 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300">
                          <Globe className="w-5 h-5" />
                        </a>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-pink-100 dark:bg-pink-900/20 text-pink-400 dark:text-pink-700 select-none cursor-not-allowed" title="No Portfolio added">
                          <Globe className="w-5 h-5" />
                        </div>
                      )}

                      {userData.resume_link ? (
                        <a href={userData.resume_link} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white hover:opacity-90 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300" title="View Resume">
                          <FileText className="w-5 h-5 fill-current" />
                        </a>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-400 dark:text-orange-700 select-none cursor-not-allowed" title="No Resume added">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Joined {userData.joinedDate}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          }
          />
          }
          />
          }
          />
          }
          />
        </div>
      </section >

      {/* Main Content Tabs */}
      < section className="container mx-auto px-4 py-6" >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="w-full bg-card border border-border/50 rounded-2xl p-1.5 shadow-sm mb-6">
            <ScrollArea className="w-full max-w-full">
              <TabsList className="w-max justify-start bg-transparent h-auto p-0 border-0 shadow-none gap-1 flex-nowrap inline-flex">
                {[
                  { value: "overview", label: "Overview", icon: User },
                  { value: "listings", label: "My Listings", icon: ShoppingBag },
                  { value: "rooms", label: "My Rooms", icon: BedDouble }, // [NEW]
                  { value: "orders", label: "My Orders", icon: ShoppingCart },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 px-4 py-2.5 gap-2 whitespace-nowrap text-sm font-medium transition-all"
                  >
                    <tab.icon className="w-4 h-4 shrink-0" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" className="hidden md:flex" />
            </ScrollArea>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="pt-6 space-y-6">
            {/* Contributor Level */}
            <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">
                      {levelName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Level {level} • {nextLevelXp - xp} XP to next level
                    </p>
                  </div>
                </div>
                <Badge className="gradient-accent text-accent-foreground border-0">
                  Top 15%
                </Badge>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Keep participating to increase your campus ranking!
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/notes">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span>Browse Notes</span>
                </Button>
              </Link>
              <Link to="/upload">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                  <Upload className="w-5 h-5 text-success" />
                  <span>Upload Content</span>
                </Button>
              </Link>
              <Link to="/events">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  <span>Find Events</span>
                </Button>
              </Link>
              <Link to="/opportunities">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                  <Briefcase className="w-5 h-5 text-warning" />
                  <span>Browse Jobs</span>
                </Button>
              </Link>
            </div>

            {/* Recent Activity */}
            {/* Split Section: Activity & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

              {/* Recent Activity */}
              <Card className="border-border/50 shadow-sm flex flex-col h-[400px]">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" /> Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0 px-6 pb-6">
                  {activities && activities.length > 0 ? (
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-4">
                        {activities.map((activity) => {
                          // Icon mapping based on action string
                          let ActIcon: any = Clock;
                          let actColor = "text-primary";
                          let dotColor = "bg-primary";
                          const lowerAction = activity.action.toLowerCase();
                          if (lowerAction.includes("login") || lowerAction.includes("logged in")) { ActIcon = null; dotColor = "bg-success"; } // Use simple dots for auth
                          else if (lowerAction.includes("logged out")) { ActIcon = null; dotColor = "bg-muted-foreground"; }
                           dotColor = "bg-success text-success-foreground p-1"; ActIcon = Upload; }
                           dotColor = "bg-info text-info-foreground p-1"; ActIcon = Download; }
                          else if (lowerAction.includes("profile")) { actColor = "text-warning"; dotColor = "bg-warning text-warning-foreground p-1"; ActIcon = User; }
                           dotColor = "bg-accent text-accent-foreground p-1"; ActIcon = Calendar; }

                          return (
                            <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                              {ActIcon === null ? (
                                <div className={`w-2.5 h-2.5 mt-2 rounded-full ${dotColor} shrink-0`} />
                              ) : (
                                <div className={`w-8 h-8 rounded-full ${dotColor} shrink-0 flex items-center justify-center shadow-sm`}>
                                  <ActIcon className="w-4 h-4" />
                                </div>
                              )}
                              <div className="flex-1 space-y-1">
                                <p className="font-semibold text-sm text-foreground">{activity.action}</p>
                                {activity.details && (
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{activity.details}</p>
                                )}
                                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">{new Date(activity.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No recent activity found.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Campus Radar / Upcoming Agenda */}
              <Card className="border-border/50 shadow-sm flex flex-col h-[400px] relative overflow-hidden group">
                {/* Premium Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-500/20 transition-all duration-700" />
                <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl opacity-50 group-hover:bg-purple-500/20 transition-all duration-700" />
                
                <CardHeader className="pb-3 border-b border-border/40 relative z-10 bg-card/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-display">
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      Campus Radar
                    </CardTitle>
                    <Badge variant="outline" className="bg-indigo-500/5 text-indigo-500 border-indigo-500/20">
                      Overview
                    </Badge>
                  </div>
                  <CardDescription className="pt-2">Upcoming events and application statuses</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-hidden p-0 relative z-10 bg-card/30">
                  <ScrollArea className="h-full px-5">
                    <div className="py-4 space-y-5">
                      {/* Apps Section */}
                      {myApplications && myApplications.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Briefcase className="w-3 h-3" /> Recent Applications
                          </h4>
                          <div className="space-y-3">
                            {myApplications.slice(0, 3).map((app: any) => (
                              <div key={app.id} className="group/item flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/50 hover:bg-muted/50 transition-all cursor-default">
                                <div className="flex flex-col overflow-hidden pr-3">
                                  <span className="font-semibold text-sm truncate group-hover/item:text-indigo-400 transition-colors">{app.opportunities?.title || 'Unknown Opportunity'}</span>
                                  <span className="text-xs text-muted-foreground truncate">{app.opportunities?.company || 'Company'}</span>
                                </div>
                                <div className="shrink-0 flex items-center">
                                  <Badge className={
                                    app.status === 'accepted' ? 'bg-success/15 text-success border-0 hover:bg-success/25' :
                                    app.status === 'rejected' ? 'bg-destructive/15 text-destructive border-0 hover:bg-destructive/25' :
                                    app.status === 'under_review' ? 'bg-blue-500/15 text-blue-500 border-0 hover:bg-blue-500/25' :
                                    'bg-warning/15 text-warning border-0 hover:bg-warning/25'
                                  }>
                                    {app.status?.replace('_', ' ') || 'pending'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Events Section */}
                      {joinedEvents && joinedEvents.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mt-2">
                            <Calendar className="w-3 h-3" /> Upcoming Events
                          </h4>
                          <div className="space-y-3">
                            {joinedEvents.slice(0, 3).map((event: any) => (
                              <div key={event.id} className="group/item flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/50 hover:bg-muted/50 transition-all cursor-default">
                                <div className="w-10 h-10 shrink-0 rounded-lg bg-indigo-500/10 text-indigo-500 flex flex-col items-center justify-center border border-indigo-500/20 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-all shadow-sm">
                                  <span className="text-[10px] font-bold uppercase leading-none mb-0.5">
                                    {new Date(event.date || Date.now()).toLocaleDateString('en-US', { month: 'short' })}
                                  </span>
                                  <span className="text-sm font-black leading-none">
                                    {new Date(event.date || Date.now()).getDate()}
                                  </span>
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="font-semibold text-sm truncate group-hover/item:text-indigo-400 transition-colors">{event.title}</span>
                                  <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {event.time || 'TBD'} • {event.venue || 'TBA'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empty State if neither exist */}
                      {!(myApplications?.length) && !(joinedEvents?.length) && (
                        <div className="flex flex-col items-center justify-center py-10 text-center opacity-80">
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 ring-4 ring-background shadow-inner">
                            <Star className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="font-semibold text-sm text-foreground">Your radar is clear</p>
                          <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
                            Apply for internships or sign up for events to see them tracked here.
                          </p>
                          <Link to="/opportunities" className="mt-4">
                            <Button variant="outline" size="sm" className="rounded-full font-medium h-8 text-xs border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-500 transition-all">
                              Find Opportunities
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* Downloads Tab */}
          


          {/* Events Tab */}
          

          {/* Courses Tab */}
          



          {/* Listings Tab */}
          <TabsContent value="listings" className="pt-6 space-y-12">


            {/* MARKETPLACE SECTION */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  Your Marketplace Listings
                </h3>
                <Link to="/marketplace">
                  <Button variant="gradient">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Visit Store
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListingsRaw?.map((item: any) => {
                  // Check if this item has an active dispute
                  // We use mySales (orders) to find matches.
                  // We look for 'disputed' status.
                  const disputedOrder = mySales?.find((s: any) => s.item_id === item.id && s.status === 'disputed');
                  const disputeId = disputedOrder?.marketplace_disputes?.[0]?.id;

                  return (
                    <div key={item.id} className="space-y-2">
                      {disputedOrder && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-center justify-between animate-pulse">
                          <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                            <ShieldAlert className="w-4 h-4" />
                            <span>Action Required: Item in Dispute</span>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => disputeId && navigate(`/dispute/${disputeId}`)}
                          >
                            View Dispute
                          </Button>
                        </div>
                      )}
                      <ItemCard
                        item={item}
                        isOwner={true}
                        isLoggedIn={true}
                        onDelete={deleteListing.mutate}
                        onStatusChange={(id: string, status: string) => updateListingStatus.mutate({ id, status })}
                        onEdit={(item: any) => setEditingItem(item)}
                      />
                    </div>
                  );
                })}
                {(!myListingsRaw || myListingsRaw.length === 0) && (
                  <div className="col-span-full py-16 text-center text-muted-foreground">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-medium">No active listings</h3>
                    <p className="mb-4">You haven't listed any items for sale yet.</p>
                    <Link to="/marketplace">
                      <Button variant="outline">Start Selling</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <EditItemDialog
            open={!!editingItem}
            onOpenChange={(open) => !open && setEditingItem(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['my-listings'] });
              queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
              setEditingItem(null);
            }}
            item={editingItem}
          />



          {/* My Orders Tab (Secure V2) */}
          <TabsContent value="orders" className="pt-6">
            <h3 className="font-display font-semibold text-foreground mb-6">
              Your Orders & Requests
            </h3>
            <div className="space-y-4">
              {myOrders?.map((order: any) => (
                <div key={order.id} className="bg-card rounded-2xl border border-border/50 shadow-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl bg-secondary/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {order.marketplace_items?.image_url ? (
                        <img src={order.marketplace_items.image_url} alt="Item" className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground">{order.marketplace_items?.title || "Unknown Item"}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className={`h-5 px-1.5 text-[10px] ${order.status === 'paid_escrow' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          {order.status === 'paid_escrow' ? 'Escrow Held' : order.status}
                        </Badge>
                        <span className="text-xs">ID: {order.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Seller: {order.marketplace_items?.profiles?.full_name || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="text-right mr-2">
                      <div className="font-bold text-lg">₹{order.amount}</div>
                      <div className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</div>
                    </div>

                    {(order.status === 'paid_escrow' || (order.status === 'completed' && !order.funds_released)) && (
                      <>
                        {order.status === 'paid_escrow' && (
                          <Button
                            onClick={() => setConfirmDialog({
                              isOpen: true,
                              title: "Confirm Receipt?",
                              description: "Confirm you received the item? This releases funds to seller (pending 48h hold).",
                              confirmText: "Yes, Received",
                              variant: "default",
                              onConfirm: () => confirmDelivery.mutate(order.id)
                            })}
                            size="sm"
                            className="w-full sm:w-auto rounded-xl shadow-lg ring-1 ring-primary/20"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirm Receipt
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedDisputeOrder(order);
                            setIsDisputeOpen(true);
                          }}
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" /> Report Issue
                        </Button>
                      </>
                    )}

                    {order.status === 'disputed' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex gap-1"
                        onClick={() => {
                          // Find the dispute ID. Since it's 1:1 usually, we take first or check structure
                          const disputeId = order.marketplace_disputes?.[0]?.id;
                          if (disputeId) navigate(`/dispute/${disputeId}`);
                        }}
                      >
                        <ShieldAlert className="w-3 h-3" /> View Dispute
                      </Button>
                    )}

                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}

              <Dialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report an Issue</DialogTitle>
                    <DialogDescription>
                      Funds will be held in escrow until the dispute is resolved by an admin.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="reason">Reason for Dispute</Label>
                      <Textarea
                        id="reason"
                        placeholder="Describe the issue (e.g. Item not received, Damaged...)"
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDisputeOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={() => raiseDispute.mutate()} disabled={!disputeReason.trim()}>
                      Raise Dispute
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {(!myOrders || myOrders.length === 0) && (
                <div className="py-16 text-center text-muted-foreground">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <h3 className="text-xl font-medium">No orders yet</h3>
                  <p className="mb-4">Requests you make will appear here.</p>
                  <Link to="/marketplace">
                    <Button variant="outline">Browse Marketplace</Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          {/* My Rooms Tab (NEW) */}
          <TabsContent value="rooms" className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-foreground">
                Your Room Listings
              </h3>
              <Link to="/rooms">
                <Button variant="gradient">
                  <BedDouble className="w-4 h-4 mr-2" />
                  List a Room
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRooms?.map((room: any) => (
                <div key={room.id} className="relative group">
                  <div className="absolute top-2 right-2 z-20 flex gap-2">
                    <Badge className={getStatusBadge(room.status)}>
                      {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    </Badge>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={() => setConfirmDialog({
                        isOpen: true,
                        title: "Delete Room Listing?",
                        description: "This will permanently remove your room listing.",
                        confirmText: "Delete",
                        variant: "destructive",
                        onConfirm: () => deleteRoom.mutate(room.id)
                      })}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                  <RoomCard room={room} />
                </div>
              ))}
              {(!myRooms || myRooms.length === 0) && (
                <div className="col-span-full py-16 text-center text-muted-foreground">
                  <BedDouble className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <h3 className="text-xl font-medium">No room listings</h3>
                  <p className="mb-4">You currently have no properties listed for rent.</p>
                  <Link to="/rooms">
                    <Button variant="outline">List Your Room</Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          {/* My Applications Tab */}
          

          {/* Events Tab */}
          
        </Tabs>
      </section >

      <CreateEventModal
        open={isEventModalOpen}
        onOpenChange={setIsEventModalOpen}
        event={editingEvent || undefined}
      />

      <ManageAttendeesModal
        open={!!managingEvent}
        onOpenChange={(open) => !open && setManagingEvent(null)}
        eventId={managingEvent?.id || ""}
        eventTitle={managingEvent?.title || ""}
      />

      {/* Reusable Premium Confirmation Dialog */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-large max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-border/50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                "rounded-xl px-6",
                confirmDialog.variant === "destructive" ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-primary hover:bg-primary/90"
              )}
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              }}
            >
              {confirmDialog.confirmText || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileNav />
      <EditNoteDialog
        open={!!editingNote}
        onOpenChange={(open) => !open && setEditingNote(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['my-uploads'] });
          setEditingNote(null);
        }}
        note={editingNote}
      />
    </div>
  );
}
