import sys

file_path = "src/components/CompanyOpportunitiesManager.tsx"

# The core parts we want to keep/fix
imports = r'''import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Edit2, Sparkles, Loader2, Star, Users, Plus, Download, Mail, CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
'''

component_start = r'''
export function CompanyOpportunitiesManager({ setConfirm }: { setConfirm: any }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);

    const emptyForm = {
        id: "",
        slug: "",
        title: "",
        company: "",
        company_logo: "",
        banner_url: "",
        category: "",
        industry: "",
        type: "Internship",
        work_mode: "Remote",
        location: "",
        duration: "",
        stipend_text: "",
        stipend_min: "",
        stipend_max: "",
        stipend_currency: "INR",
        work_hours: "",
        employment_type: "",
        experience: "",
        eligibility: "",
        education: "",
        required_skills: "",
        branches_allowed: "",
        year_of_study: "",
        age_limit: "",
        description: "",
        introduction: "",
        program_overview: "",
        domains: "",
        eligibility_criteria: "",
        how_to_apply: "",
        faqs: [] as { question: string; answer: string }[],
        show_header: true,
        show_role_overview: true,
        show_eligibility_skills: true,
        show_introduction: true,
        show_program_overview: true,
        show_domains: true,
        show_eligibility_criteria: true,
        show_how_to_apply: true,
        show_faqs: true,
        show_listing_details: true,
        show_share: true,
        apply_by: "",
        valid_through: "",
        openings: "",
        open_method: "",
        application_fee: "",
        apply_url: "",
        is_paid: false,
        is_featured: false,
        referral_code: "",
        show_referral_code: false,
    };

    const [formData, setFormData] = useState({ ...emptyForm });
    const [suggestingField, setSuggestingField] = useState<string | null>(null);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [viewingApplicantsFor, setViewingApplicantsFor] = useState<any>(null);

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;
            const file = e.target.files[0];
            if (!file) return;

            setUploadingBanner(true);
            const fileExt = file.name.split('.').pop() || 'png';
            const fileName = `opportunity-banner-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, banner_url: publicUrl }));
            toast({ title: "Upload Success", description: "Banner image uploaded successfully." });
        } catch (err: any) {
            console.error("Banner upload error:", err);
            toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
        } finally {
            setUploadingBanner(false);
        }
    };

    const fetchAiSuggestion = async (field: string) => {
        if (!formData.title || !formData.company) {
            toast({
                title: "Missing Info",
                description: "Please enter Title and Company first for AI to work!",
                variant: "destructive"
            });
            return;
        }

        setSuggestingField(field);
        try {
            const { data, error } = await supabase.functions.invoke('opportunity-suggestions', {
                body: { title: formData.title, company: formData.company, field }
            });

            if (error) {
                console.error("Supabase Function Error Object:", error);
                throw error;
            }
            if (data?.error) throw new Error(data.error);
            
            if (data?.suggestion) {
                if (field === 'faqs' && Array.isArray(data.suggestion)) {
                    setFormData(prev => ({ ...prev, faqs: [...(prev.faqs || []), ...data.suggestion] }));
                } else {
                    setFormData(prev => ({ ...prev, [field]: data.suggestion }));
                }
                toast({ title: "AI Suggestion Added!", description: `Field ${field} updated.` });
            }
        } catch (err: any) {
            console.error("AI Suggestion Error FULL:", err);
            let errorMessage = err.message || "An unknown error occurred";
            if (err.context) {
                try {
                    const body = await err.context.json();
                    if (body.error) errorMessage = `${body.error}`;
                    if (body.details) errorMessage += ` - ${body.details}`;
                } catch (e) {
                    try {
                        const text = await err.context.text();
                        errorMessage += ` (${text})`;
                    } catch (e2) {}
                }
            }
            toast({ title: "AI Failed", description: errorMessage, variant: "destructive" });
        } finally {
            setSuggestingField(null);
        }
    };

    const AiSuggestButton = ({ field }: { field: string }) => (
        <Button
            size="sm"
            variant="ghost"
            type="button"
            className="h-7 px-2.5 rounded-full text-indigo-600 dark:text-indigo-400 font-black text-[9px] tracking-wider hover:bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm transition-all duration-300"
            onClick={() => fetchAiSuggestion(field)}
            disabled={suggestingField === field}
        >
            {suggestingField === field ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Sparkles className="w-4 h-4" />
            )}
            <span className="ml-1.5 text-[10px] font-black uppercase tracking-wider">AI</span>
        </Button>
    );

    const toCsv = (value: any) => Array.isArray(value) ? value.join(", ") : (value || "");
    const toList = (value: string) => (value || "").split(/\n|,/).map(v => v.trim()).filter(Boolean);
    const slugify = (value: string) =>
        value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    const normalizeType = (value?: string) =>
        (value || "").toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim();
    
    const canonicalType = (value?: string) => {
        const v = normalizeType(value);
        if (v === "internship") return "Internship";
        if (v === "campus ambassador" || v === "campusambassador") return "Campus Ambassador";
        if (v === "swags and certification" || v === "swags and certificates" || v === "swags certification") return "Swags and Certification";
        if (v === "job") return "Job";
        return value?.trim() || "Internship";
    };

    const resetForm = (data?: any, typeOverride?: string) => {
        if (!data) {
            setFormData({ ...emptyForm, type: typeOverride || emptyForm.type });
            return;
        }
        setFormData({
            ...emptyForm,
            ...data,
            stipend_min: data.stipend_min ?? "",
            stipend_max: data.stipend_max ?? "",
            openings: data.openings ?? "",
            application_fee: data.application_fee ?? "",
            required_skills: toCsv(data.required_skills),
            branches_allowed: toCsv(data.branches_allowed),
            domains: toCsv(data.domains),
            eligibility_criteria: toCsv(data.eligibility_criteria),
            how_to_apply: toCsv(data.how_to_apply),
            faqs: Array.isArray(data.faqs) ? data.faqs : [],
            show_header: data.show_header ?? true,
            show_role_overview: data.show_role_overview ?? true,
            show_eligibility_skills: data.show_eligibility_skills ?? true,
            show_introduction: data.show_introduction ?? true,
            show_program_overview: data.show_program_overview ?? true,
            show_domains: data.show_domains ?? true,
            show_eligibility_criteria: data.show_eligibility_criteria ?? true,
            show_how_to_apply: data.show_how_to_apply ?? true,
            show_faqs: data.show_faqs ?? true,
            show_listing_details: data.show_listing_details ?? true,
            show_share: data.show_share ?? true,
            is_featured: !!data.is_featured,
            referral_code: data.referral_code || "",
            show_referral_code: !!data.show_referral_code,
            apply_by: data.apply_by || "",
            valid_through: data.valid_through || "",
            type: canonicalType(typeOverride || data.type || "Internship"),
        });
    };

    const { data: opportunities = [], isLoading } = useQuery({
        queryKey: ['company-opportunities'],
        queryFn: async () => {
            const credsStr = localStorage.getItem("company_session");
            if (!credsStr) return [];
            const sessionObj = JSON.parse(credsStr);
            const { data, error } = await supabase.from('opportunities').select('*').eq('client_uuid', sessionObj.id).order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: applications = [], isLoading: applicationsLoading } = useQuery({
        queryKey: ['company-applications'],
        queryFn: async () => {
            const credsStr = localStorage.getItem("company_session");
            if (!credsStr) return [];
            const sessionObj = JSON.parse(credsStr);
            const { data: ops } = await supabase.from('opportunities').select('id').eq('client_uuid', sessionObj.id);
            if (!ops || ops.length === 0) return [];
            const ids = ops.map(o => o.id);
            const { data, error } = await supabase.from('applications').select('*, profiles:user_id(full_name, email, avatar_url)').in('opportunity_id', ids);
            if (error) throw error;
            return (data || []).map(a => ({
                id: a.id,
                opportunity_id: a.opportunity_id,
                user_id: a.user_id,
                name: a.profiles?.full_name || "Guest",
                email: a.profiles?.email || "No email",
                avatar: a.profiles?.avatar_url,
                college: a.college,
                branch: a.branch,
                year_of_study: a.year_of_study,
                status: a.status,
                phone: a.phone,
                linkedin_url: a.linkedin_url,
                portfolio_url: a.portfolio_url,
                resume_url: a.resume_url,
                created_at: a.created_at
            }));
        }
    });

    const updateApplicationStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { error } = await supabase.from('applications').update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-applications'] }),
        onError: (err: any) => toast({ title: "Update Failed", description: err.message, variant: "destructive" })
    });

    const deleteApplication = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('applications').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-applications'] }),
        onError: (err: any) => toast({ title: "Delete Failed", description: err.message, variant: "destructive" })
    });

    const canSubmit = useMemo(() => formData.title && formData.company && formData.slug, [formData]);

    const sectionKeys = {
        internships: "show_opportunities_internships",
        ambassadors: "show_opportunities_campus_ambassador",
        swags: "show_opportunities_swags_certification",
    };

    const { data: sectionSettings } = useQuery({
        queryKey: ['admin-opportunity-sections'],
        queryFn: async () => {
            const { data } = await supabase.from('system_settings').select('key,value').in('key', Object.values(sectionKeys));
            const map: Record<string, string> = {};
            data?.forEach((row: any) => { map[row.key] = row.value; });
            return map;
        }
    });

    const updateSetting = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: string }) => {
            await supabase.from('system_settings').upsert({ key, value, description: 'Updated via Opportunities Manager' });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-opportunity-sections'] }),
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const sectionEnabled = (key: string) => sectionSettings?.[key] !== 'false';

    const openCreate = (type?: string) => {
        setEditing(null);
        resetForm(null, type);
        setDialogOpen(true);
    };

    const openEdit = (item: any) => {
        setEditing(item.id);
        resetForm(item);
        setDialogOpen(true);
    };

    const upsertOpportunity = useMutation({
        mutationFn: async () => {
            const credsStr = localStorage.getItem("company_session");
            const sessionObj = JSON.parse(credsStr || "{}");
            const payload = {
                ...formData,
                stipend_min: formData.stipend_min ? parseFloat(formData.stipend_min) : null,
                stipend_max: formData.stipend_max ? parseFloat(formData.stipend_max) : null,
                openings: formData.openings ? parseInt(formData.openings) : null,
                application_fee: formData.application_fee ? parseFloat(formData.application_fee) : null,
                required_skills: toList(formData.required_skills),
                branches_allowed: toList(formData.branches_allowed),
                domains: toList(formData.domains),
                eligibility_criteria: toList(formData.eligibility_criteria),
                how_to_apply: toList(formData.how_to_apply),
                client_uuid: sessionObj.id
            };
            const { id, ...cleanPayload } = payload as any;
            if (editing) {
                const { error } = await supabase.from('opportunities').update(cleanPayload).eq('id', editing);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('opportunities').insert([cleanPayload]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-opportunities'] });
            setDialogOpen(false);
            toast({ title: "Success", description: editing ? "Updated successfully" : "Created successfully" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const deleteOpportunity = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('opportunities').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-opportunities'] });
            toast({ title: "Deleted", description: "Opportunity removed successfully" });
        },
        onError: (err: any) => toast({ title: "Delete Failed", description: err.message, variant: "destructive" })
    });

    const toggleFeatured = useMutation({
        mutationFn: async (id: string) => {
            const item = opportunities.find((o: any) => o.id === id);
            const { error } = await supabase.from('opportunities').update({ is_featured: !item.is_featured }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-opportunities'] }),
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const sections = [
        { key: "Internship", title: "Internships" },
        { key: "Campus Ambassador", title: "Campus Ambassadors" },
        { key: "Swags and Certification", title: "Swags & Certification" }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600/10 via-white to-indigo-600/5 dark:from-indigo-600/20 dark:via-slate-900 dark:to-slate-950 border border-indigo-500/10 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="relative">
                    <h2 className="text-3xl md:text-4xl font-black font-display text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-indigo-500" />
                        Company Portal
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-3 text-base md:text-lg font-medium max-w-xl">
                        Launch your projects by posting <span className="text-indigo-600 dark:text-indigo-400 font-bold">Internships</span>, <span className="text-indigo-600 dark:text-indigo-400 font-bold">Ambassador roles</span>, or <span className="text-indigo-600 dark:text-indigo-400 font-bold">Swags</span>.
                    </p>
                </div>
                <Button 
                    size="lg" 
                    className="relative bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg px-10 h-16 rounded-2xl shadow-[0_20px_40px_-15px_rgba(79,70,229,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                    onClick={() => openCreate("Internship")}
                >
                    <Plus className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                    Create New Listing
                </Button>
            </div>

            {sections.map((section) => {
                const items = opportunities.filter((item: any) => {
                    const itemType = canonicalType(item.type);
                    return normalizeType(itemType) === normalizeType(section.key);
                });
                return (
                    <Card key={section.key} className="border-border/50 shadow-sm">
                        <CardHeader className="flex-row items-center justify-between">
                            <div>
                                <CardTitle>{section.title}</CardTitle>
                                <CardDescription>{items.length} listings</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="rounded-md border border-border/50 overflow-x-auto">
                                <table className="w-full text-sm min-w-[900px]">
                                    <thead className="bg-muted/50 border-b border-border/50 text-left">
                                        <tr>
                                            <th className="p-4 font-medium text-muted-foreground">Title</th>
                                            <th className="p-4 font-medium text-muted-foreground">Company</th>
                                            <th className="p-4 font-medium text-muted-foreground">Location</th>
                                            <th className="p-4 font-medium text-muted-foreground">Apply By</th>
                                            <th className="p-4 font-medium text-muted-foreground text-center">Featured</th>
                                            <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {isLoading && (
                                            <tr>
                                                <td colSpan={6} className="p-6 text-center text-muted-foreground">Loading opportunities...</td>
                                            </tr>
                                        )}
                                        {!isLoading && items.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-6 text-center text-muted-foreground italic">No listings in this section.</td>
                                            </tr>
                                        )}
                                        {!isLoading && items.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                                                <td className="p-4 font-medium max-w-[280px] truncate" title={item.title}>{item.title}</td>
                                                <td className="p-4">{item.company || "—"}</td>
                                                <td className="p-4">{item.location || "—"}</td>
                                                <td className="p-4 text-muted-foreground">{item.apply_by || "—"}</td>
                                                <td className="p-4 text-center">
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className={cn(
                                                            "transition-all duration-300",
                                                            item.is_featured ? "text-amber-500 hover:text-amber-600 bg-amber-50" : "text-muted-foreground hover:text-amber-500"
                                                        )}
                                                        onClick={() => toggleFeatured.mutate(item.id)}
                                                        disabled={toggleFeatured.isPending}
                                                    >
                                                        <Star className={cn("w-4 h-4", item.is_featured && "fill-current")} />
                                                    </Button>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="text-indigo-600 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-200"
                                                            onClick={() => setViewingApplicantsFor(item)}
                                                        >
                                                            <Users className="w-3.5 h-3.5 mr-1.5" />
                                                            <span className="font-bold">
                                                                {applications.filter((a: any) => a.opportunity_id === item.id).length}
                                                            </span>
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                                                          <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="hover:bg-destructive/10 text-destructive"
                                                            onClick={() => setConfirm({
                                                                isOpen: true,
                                                                title: "Delete Opportunity?",
                                                                description: "Are you sure you want to delete this listing?",
                                                                confirmText: "Delete",
                                                                variant: "destructive",
                                                                onConfirm: () => deleteOpportunity.mutate(item.id)
                                                            })}
                                                            disabled={deleteOpportunity.isPending}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="w-[98vw] md:max-w-4xl p-0 overflow-hidden bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800/80 shadow-[0_0_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_0_100px_-20px_rgba(79,70,229,0.15)] sm:rounded-[2rem]">
                    <DialogHeader className="px-6 py-6 bg-gradient-to-br from-indigo-950 via-[#0B1120] to-black text-white relative overflow-hidden border-b border-white/5">
                        <DialogTitle className="text-lg md:text-2xl font-black tracking-tight">{editing ? "Edit Opportunity" : "Create Opportunity"}</DialogTitle>
                        <DialogDescription className="text-indigo-200/70 font-medium">Fill out the details for this listing.</DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[70vh] overflow-y-auto p-4 md:p-6 space-y-4">
                        {/* CORE IDENTITY */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/40 backdrop-blur-xl shadow-lg p-4 md:p-6 transition-all duration-300">
                             <div className="flex flex-row items-center justify-between gap-4 mb-3 md:mb-4">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">Core</div>
                                    <div className="text-sm md:text-base font-bold font-display text-slate-900 dark:text-slate-100">Listing Identity</div>
                                </div>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Title</Label>
                                    <Input 
                                        placeholder="e.g. Frontend Developer"
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.title} 
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: editing ? formData.slug : slugify(e.target.value) })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Company</Label>
                                    <Input 
                                        placeholder="e.g. Acme Inc"
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.company} 
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Slug (URL component)</Label>
                                    <Input 
                                        placeholder="e.g. frontend-developer"
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.slug} 
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Listing Type</Label>
                                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                        <SelectTrigger className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 rounded-xl h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Internship">Internship</SelectItem>
                                            <SelectItem value="Campus Ambassador">Campus Ambassador</SelectItem>
                                            <SelectItem value="Swags and Certification">Swags & Certification</SelectItem>
                                            <SelectItem value="Job">Job</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>
                        </div>

                        {/* BANNER & MEDIA */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/40 backdrop-blur-xl shadow-lg p-4 md:p-6 transition-all duration-300">
                             <div className="flex flex-row items-center justify-between gap-4 mb-3 md:mb-4">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">Appearance</div>
                                    <div className="text-sm md:text-base font-bold font-display text-slate-900 dark:text-slate-100">Media & Branding</div>
                                </div>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 text-left">Banner Image URL</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="https://..."
                                            className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                            value={formData.banner_url} 
                                            onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })} 
                                        />
                                        <div className="relative">
                                            <Button size="icon" variant="outline" className="h-11 w-11 rounded-xl shrink-0" disabled={uploadingBanner}>
                                                {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            </Button>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleBannerUpload} disabled={uploadingBanner} />
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* DETAILS */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/40 backdrop-blur-xl shadow-lg p-4 md:p-6 transition-all duration-300">
                             <div className="flex flex-row items-center justify-between gap-4 mb-3 md:mb-4">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">Parameters</div>
                                    <div className="text-sm md:text-base font-bold font-display text-slate-900 dark:text-slate-100">Work Details & Pay</div>
                                </div>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Location</Label>
                                    <Input 
                                        placeholder="e.g. Remote, Mumbai"
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.location} 
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Duration</Label>
                                    <Input 
                                        placeholder="e.g. 6 Months"
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.duration} 
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Stipend Text</Label>
                                    <Input 
                                        placeholder="e.g. 5,000 / month"
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.stipend_text} 
                                        onChange={(e) => setFormData({ ...formData, stipend_text: e.target.value })} 
                                    />
                                </div>
                             </div>
                        </div>

                        {/* ELIGIBILITY & CONTENT */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/40 backdrop-blur-xl shadow-lg p-4 md:p-6 transition-all duration-300">
                            <div className="flex flex-row items-center justify-between gap-4 mb-3 md:mb-4 text-left">
                                <Label className="text-xs md:text-sm font-black uppercase text-indigo-500">Who Can Apply & Description</Label>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Eligibility</Label>
                                        <AiSuggestButton field="eligibility" />
                                    </div>
                                    <Textarea 
                                        className="bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 rounded-2xl p-4 shadow-sm"
                                        value={formData.eligibility} 
                                        onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Description</Label>
                                        <AiSuggestButton field="description" />
                                    </div>
                                    <Textarea 
                                        className="min-h-[120px] bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 rounded-2xl p-4 shadow-sm"
                                        value={formData.description} 
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#070b14]/50 backdrop-blur-md flex items-center justify-between gap-4">
                        <Button variant="outline" className="dark:bg-slate-800 dark:text-white dark:border-slate-700" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => upsertOpportunity.mutate()} disabled={upsertOpportunity.isPending || !canSubmit}>
                            {upsertOpportunity.isPending ? "Saving..." : "Save Opportunity"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// --- BLOG & NEWS MANAGER ---
'''

with open(file_path, "w") as f:
    f.write(imports + component_start)

print("File reconstructed successfully.")
