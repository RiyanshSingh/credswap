import re

file_path = "src/components/CompanyOpportunitiesManager.tsx"
with open(file_path, "r") as f:
    content = f.read()

# The query hook return block at line 289 is broken.
# It currently has:
# 289:             return (
# 290: 
# 291:         <div className="space-y-8 animate-fade-in">

# It should be:
# 289:             return (data || []).map(a => ({ ...a }));
# 290:         }
# 291:     });
# ... (all the logic) ...
# return ( <div ... ); }

# I will find the 'return (' at line 289 and fix it.
pattern = r'return \(\s+<div className="space-y-8 animate-fade-in">'
# We need to close the query first.
fixed = r'''            return (data || []).map(a => ({
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
            const { data } = await supabase
                .from('system_settings')
                .select('key,value')
                .in('key', Object.values(sectionKeys));
            const map: Record<string, string> = {};
            data?.forEach((row: any) => { map[row.key] = row.value; });
            return map;
        }
    });

    const updateSetting = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: string }) => {
            const { error } = await supabase
                .from('system_settings')
                .upsert({ key, value, description: 'Updated via Opportunities Manager' });
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-opportunity-sections'] }),
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const sectionEnabled = (key: string) => sectionSettings?.[key] !== 'false';

    return (
        <div className="space-y-8 animate-fade-in">'''

content = re.sub(pattern, fixed, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)

print("Logic hook closed and main return fixed.")
