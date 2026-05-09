import re

file_path = "src/components/CompanyOpportunitiesManager.tsx"
with open(file_path, "r") as f:
    content = f.read()

# I will replace the ENTIRE return block from the start of the return down to the Dialog component.
# This ensures we don't have dangling maps or tags.

header_section = '''
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
'''

new_return_block = f'''
    return (
        <div className="space-y-8 animate-fade-in">
            {header_section}

            {{sections.map((section) => {{
                const items = opportunities.filter((item: any) => {{
                    const itemType = canonicalType(item.type);
                    return normalizeType(itemType) === normalizeType(section.key);
                }});
                return (
                    <Card key={section.key} className="border-border/50 shadow-sm">
                        <CardHeader className="flex-row items-center justify-between">
                            <div>
                                <CardTitle>{{section.title}}</CardTitle>
                                <CardDescription>{{items.length}} listings</CardDescription>
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
                                        {{isLoading && (
                                            <tr>
                                                <td colSpan={{6}} className="p-6 text-center text-muted-foreground">Loading opportunities...</td>
                                            </tr>
                                        )}}
                                        {{!isLoading && items.map((item: any) => (
                                            <tr key={{item.id}} className="hover:bg-secondary/30 transition-colors">
                                                <td className="p-4 font-medium max-w-[280px] truncate" title={{item.title}}>{{item.title}}</td>
                                                <td className="p-4">{{item.company || "—"}}</td>
                                                <td className="p-4">{{item.location || "—"}}</td>
                                                <td className="p-4 text-muted-foreground">{{item.apply_by || "—"}}</td>
                                                <td className="p-4 text-center">
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className={{cn(
                                                            "transition-all duration-300",
                                                            item.is_featured ? "text-amber-500 hover:text-amber-600 bg-amber-50" : "text-muted-foreground hover:text-amber-500"
                                                        )}}
                                                        onClick={{() => toggleFeatured.mutate(item.id)}}
                                                        disabled={{toggleFeatured.isPending}}
                                                    >
                                                        <Star className={{cn("w-4 h-4", item.is_featured && "fill-current")}} />
                                                    </Button>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="text-indigo-600 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-200"
                                                            onClick={{() => setViewingApplicantsFor(item)}}
                                                        >
                                                            <Users className="w-3.5 h-3.5 mr-1.5" />
                                                            <span className="font-bold">
                                                                {{applications.filter((a: any) => a.opportunity_id === item.id).length}}
                                                            </span>
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={{() => openEdit(item)}}>
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="hover:bg-destructive/10 text-destructive"
                                                            onClick={{() => setConfirm({{
                                                                isOpen: true,
                                                                title: "Delete Opportunity?",
                                                                description: "Are you sure you want to delete this listing?",
                                                                confirmText: "Delete",
                                                                variant: "destructive",
                                                                onConfirm: () => deleteOpportunity.mutate(item.id)
                                                            }})}}
                                                            disabled={{deleteOpportunity.isPending}}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                );
            }})}}

            <Dialog
'''

# The pattern covers from the previous return start to the dialog start
pattern = r'const sectionEnabled = \(key: string\) => sectionSettings\?\.\[key\] !== \'false\';\s+return \(.*?<Dialog'
# Replace it all
replacement = f"const sectionEnabled = (key: string) => sectionSettings?.[key] !== 'false';\n\n{new_return_block}"

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)

print("Return block fully reconstructed.")
