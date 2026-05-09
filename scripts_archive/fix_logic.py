import re

file_path = "src/components/CompanyOpportunitiesManager.tsx"
with open(file_path, "r") as f:
    content = f.read()

# I will insert the missing logic before the return (line 361)
insertion_point = '    return ('

logic_to_insert = r'''
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
            delete (payload as any).id;

            if (editing) {
                const { error } = await supabase.from('opportunities').update(payload).eq('id', editing);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('opportunities').insert([payload]);
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

'''

content = content.replace(insertion_point, logic_to_insert + insertion_point)

with open(file_path, "w") as f:
    f.write(content)

print("Logic restored.")
