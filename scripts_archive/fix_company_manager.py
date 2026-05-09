import re

with open("src/components/CompanyOpportunitiesManager.tsx", "r") as f:
    text = f.read()

# Replace admin_creds logic with company_session
text = text.replace('localStorage.getItem("admin_creds")', 'localStorage.getItem("company_session")')
text = text.replace('const creds = JSON.parse(credsStr);', 'const sessionObj = JSON.parse(credsStr);')

# Replace Opportunities Fetch
fetch_opps_admin = """            const { data, error } = await supabase.rpc('admin_get_opportunities', {
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) {
                console.error("Admin Opportunities Fetch Error", error);
                toast({
                    title: "Failed to load opportunities",
                    description: error.message || "Unknown RPC error. Did you run the migration?",
                    variant: "destructive"
                });
                const { data: fallback } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false });
                return fallback || [];
            }
            return data || [];"""
            
fetch_opps_comp = """            const { data, error } = await supabase.from('opportunities').select('*').eq('client_uuid', sessionObj.id).order('created_at', { ascending: false });
            if (error) {
                console.error("Company Opportunities Fetch Error", error);
                toast({ title: "Failed to load opportunities", description: error.message, variant: "destructive" });
                return [];
            }
            return data || [];"""

text = text.replace(fetch_opps_admin, fetch_opps_comp)
text = text.replace("p_username: sessionObj.username,\n                p_password: sessionObj.password", "") # remove other RPC args

# Replace Applications Fetch
app_fetch_admin = """            const { data, error } = await supabase.rpc('admin_get_opportunity_applications', {
                
            });
            if (error) {
                console.error("Admin Applications Fetch Error", error);
                toast({ title: "Failed to load applications", description: error.message, variant: "destructive" });
                return [];
            }
            return data || [];"""
            
app_fetch_comp = """            const { data: ops } = await supabase.from('opportunities').select('id').eq('client_uuid', sessionObj.id);
            if (!ops || ops.length === 0) return [];
            const ids = ops.map(o => o.id);
            const { data, error } = await supabase.from('applications').select('*, profiles:user_id(full_name, email, avatar_url)').in('opportunity_id', ids);
            if (error) {
                console.error("Company Applications Fetch Error", error);
                return [];
            }
            return (data || []).map(a => ({
                ...a,
                user_name: a.profiles?.full_name,
                user_email: a.profiles?.email
            }));"""

text = re.sub(r'const \{ data, error \} = await supabase.rpc\(\'admin_get_opportunity_applications\', \{[^}]+\}\);.*?return data \|\| \[\];', app_fetch_comp, text, flags=re.DOTALL)


# Delete Opportunity
delete_opp_admin = """            const { error } = await supabase.rpc('admin_delete_opportunity', {
                p_opportunity_id: id,
                
            });"""
delete_opp_comp = """            const { error } = await supabase.from('opportunities').delete().eq('id', id).eq('client_uuid', sessionObj.id);"""

text = re.sub(r'const \{ error \} = await supabase.rpc\(\'admin_delete_opportunity\', \{[^\}]+\}\);', delete_opp_comp, text, flags=re.DOTALL)


# Update Application Status
update_app_admin = """            const { error } = await supabase.rpc('admin_update_opportunity_application_status', {
                p_id: id,
                p_status: status,
                
            });"""
update_app_comp = """            const { error } = await supabase.from('applications').update({ status }).eq('id', id);"""

text = re.sub(r'const \{ error \} = await supabase.rpc\(\'admin_update_opportunity_application_status\', \{[^\}]+\}\);', update_app_comp, text, flags=re.DOTALL)


# Delete Application
delete_app_admin = """            const { error } = await supabase.rpc('admin_delete_opportunity_application', {
                p_id: id,
                
            });"""
delete_app_comp = """            const { error } = await supabase.from('applications').delete().eq('id', id);"""

text = re.sub(r'const \{ error \} = await supabase.rpc\(\'admin_delete_opportunity_application\', \{[^\}]+\}\);', delete_app_comp, text, flags=re.DOTALL)

# Toggle Featured (Clients shouldn't do this freely, but we enable it locally)
featured_admin = """            const { data, error } = await supabase.rpc('admin_set_opportunity_featured', {
                p_opportunity_id: id,
                
            });"""
featured_comp = """            const { data: opp } = await supabase.from('opportunities').select('is_featured').eq('id', id).single();
            const { data, error } = await supabase.from('opportunities').update({ is_featured: !opp.is_featured }).eq('id', id).select().single();"""

text = re.sub(r'const \{ data, error \} = await supabase.rpc\(\'admin_set_opportunity_featured\', \{[^\}]+\}\);', featured_comp, text, flags=re.DOTALL)

# Replace Upsert 
upsert_admin = """            const { data, error } = await supabase.rpc('admin_upsert_opportunity', {
                
                p_data: payload
            });"""
upsert_comp = """            
            payload.client_uuid = sessionObj.id;
            const { data, error } = await supabase.from('opportunities').upsert(payload, { onConflict: 'id' }).select();"""
text = re.sub(r'const \{ data, error \} = await supabase.rpc\(\'admin_upsert_opportunity\', \{[^\}]+\}\);', upsert_comp, text, flags=re.DOTALL)


# Export correction
text = text.replace("export function OpportunitiesManager", "export function CompanyOpportunitiesManager")
text = text.replace("['admin-opportunities']", "['company-opportunities']")
text = text.replace("['admin-opportunity-applications']", "['company-applications']")

with open("src/components/CompanyOpportunitiesManager.tsx", "w") as out:
    out.write(text)

