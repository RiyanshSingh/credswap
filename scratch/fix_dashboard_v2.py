import sys

file_path = '/Users/riyansh/Cloudburst/src/pages/AdminDashboard.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

# 1. Remove the broken dialog at 1487
# In current lines (0-indexed), 1487 is lines[1486]
# Let's find the range [1485, 1565] in 0-indexed: lines[1485] to lines[1565]
# Wait, let's be more precise.
start_broken = -1
for i, line in enumerate(lines):
    if ': { open: boolean, onOpenChange: (open: boolean) => void, initialData: Event | null' in line:
        start_broken = i
        break

if start_broken != -1:
    # Find where this block ends (usually at a line with just '}')
    # It ends before ContentModeration
    end_broken = -1
    for i in range(start_broken, len(lines)):
        if 'function ContentModeration' in lines[i]:
            end_broken = i - 1
            break
    
    if end_broken != -1:
        print(f"Removing broken block from {start_broken+1} to {end_broken+1}")
        del lines[start_broken:end_broken]

# 2. Refactor ContentModeration to remove Events and Notes
new_moderation = [
    "function ContentModeration({ setConfirm }: { setConfirm: any }) {\n",
    "    const queryClient = useQueryClient();\n",
    "    const { toast } = useToast();\n",
    "\n",
    "    const { data: pendingMarketplaceItems } = useQuery<MarketplaceItem[]>({\n",
    "        queryKey: ['admin-marketplace'], queryFn: async () => {\n",
    "            const { data } = await supabase.from('marketplace_items').select('*').eq('status', 'pending'); return data || [];\n",
    "        }\n",
    "    });\n",
    "    const { data: pendingRooms } = useQuery<Room[]>({\n",
    "        queryKey: ['admin-rooms'], queryFn: async () => {\n",
    "            const { data } = await supabase.from('rooms').select('*, profiles(full_name, email)').eq('status', 'pending'); return data || [];\n",
    "        }\n",
    "    });\n",
    "\n",
    "    const updateStatus = useMutation({\n",
    "        mutationFn: async ({ table, id, status }: { table: string, id: string, status: string }) => {\n",
    "            const { error } = await supabase.from(table).update({ status }).eq('id', id);\n",
    "            if (error) throw error;\n",
    "        },\n",
    "        onSuccess: (data, variables) => {\n",
    "            queryClient.invalidateQueries({ queryKey: [`admin-${variables.table}`] });\n",
    "            queryClient.invalidateQueries({ queryKey: ['admin-marketplace'] });\n",
    "            queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });\n",
    "            queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });\n",
    "            toast({ title: \"Updated\", description: `Item marked as ${variables.status}` });\n",
    "        },\n",
    "        onError: (error) => {\n",
    "            toast({ title: \"Error\", description: error.message, variant: \"destructive\" });\n",
    "        }\n",
    "    });\n",
    "\n",
    "    return (\n",
    "        <div className=\"space-y-6 animate-fade-in\">\n",
    "            <div>\n",
    "                <h2 className=\"text-2xl font-bold font-display\">Content Moderation</h2>\n",
    "                <p className=\"text-muted-foreground\">Review user submissions and requests.</p>\n",
    "            </div>\n",
    "\n",
    "            <Tabs defaultValue=\"marketplace\" className=\"w-full\">\n",
    "                <TabsList className=\"bg-background border border-border/50 h-auto flex-wrap justify-start gap-2 p-1\">\n",
    "                    <TabsTrigger className=\"rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300\" value=\"marketplace\">Marketplace ({pendingMarketplaceItems?.length || 0})</TabsTrigger>\n",
    "                    <TabsTrigger className=\"rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300\" value=\"rooms\">Rooms ({pendingRooms?.length || 0})</TabsTrigger>\n",
    "                </TabsList>\n",
    "\n",
    "                <TabsContent value=\"marketplace\" className=\"space-y-4 mt-4\">\n",
    "                    <div className=\"grid grid-cols-1 gap-4\">\n",
    "                        {pendingMarketplaceItems?.map((item: MarketplaceItem) => (\n",
    "                            <div key={item.id} className=\"bg-card border border-border/50 p-4 rounded-lg flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center\">\n",
    "                                <div className=\"flex gap-4\">\n",
    "                                    <div className=\"w-16 h-16 bg-secondary/30 rounded-md overflow-hidden shrink-0\">\n",
    "                                        {item.image_url ? (\n",
    "                                            <img src={item.image_url} className=\"w-full h-full object-cover\" />\n",
    "                                        ) : (\n",
    "                                            <div className=\"flex items-center justify-center h-full text-xs text-muted-foreground\">No Img</div>\n",
    "                                        )}\n",
    "                                    </div>\n",
    "                                    <div>\n",
    "                                        <h4 className=\"font-semibold text-lg\">{item.title}</h4>\n",
    "                                        <p className=\"text-sm text-muted-foreground\">\n",
    "                                            ₹{item.price} • {item.category}\n",
    "                                        </p>\n",
    "                                    </div>\n",
    "                                </div>\n",
    "                                <div className=\"flex items-center gap-2\">\n",
    "                                    <Button size=\"sm\" variant=\"outline\" className=\"text-destructive hover:text-destructive\" onClick={() => updateStatus.mutate({ table: 'marketplace_items', id: item.id, status: 'rejected' })}>Reject</Button>\n",
    "                                    <Button size=\"sm\" onClick={() => updateStatus.mutate({ table: 'marketplace_items', id: item.id, status: 'approved' })}>Approve</Button>\n",
    "                                </div>\n",
    "                            </div>\n",
    "                        ))}\n",
    "                        {pendingMarketplaceItems?.length === 0 && <p className=\"text-muted-foreground italic text-center py-8\">No pending marketplace items.</p>}\n",
    "                    </div>\n",
    "                </TabsContent>\n",
    "\n",
    "                <TabsContent value=\"rooms\" className=\"space-y-4 mt-4\">\n",
    "                    <div className=\"grid grid-cols-1 gap-4\">\n",
    "                        {pendingRooms?.map((item: Room) => (\n",
    "                            <div key={item.id} className=\"bg-card border border-border/50 p-4 rounded-lg flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center\">\n",
    "                                <div className=\"flex gap-4\">\n",
    "                                    <div className=\"w-16 h-16 bg-secondary/30 rounded-md overflow-hidden shrink-0\">\n",
    "                                        {item.images?.[0] ? (\n",
    "                                            <img src={item.images[0]} className=\"w-full h-full object-cover\" />\n",
    "                                        ) : (\n",
    "                                            <div className=\"flex items-center justify-center h-full text-xs text-muted-foreground\">No Img</div>\n",
    "                                        )}\n",
    "                                    </div>\n",
    "                                    <div>\n",
    "                                        <h4 className=\"font-semibold text-lg\">{item.title}</h4>\n",
    "                                        <p className=\"text-sm text-muted-foreground\">{item.category} • ₹{item.price}/month</p>\n",
    "                                    </div>\n",
    "                                </div>\n",
    "                                <div className=\"flex items-center gap-2\">\n",
    "                                    <Button size=\"sm\" variant=\"outline\" className=\"text-destructive hover:text-destructive\" onClick={() => updateStatus.mutate({ table: 'rooms', id: item.id, status: 'rejected' })}>Reject</Button>\n",
    "                                    <Button size=\"sm\" onClick={() => updateStatus.mutate({ table: 'rooms', id: item.id, status: 'approved' })}>Approve</Button>\n",
    "                                </div>\n",
    "                            </div>\n",
    "                        ))}\n",
    "                        {pendingRooms?.length === 0 && <p className=\"text-muted-foreground italic text-center py-8\">No pending room listings.</p>}\n",
    "                    </div>\n",
    "                </TabsContent>\n",
    "            </Tabs>\n",
    "        </div>\n",
    "    );\n",
    "}\n"
]

# Find where ContentModeration starts and ends to replace it
mod_start = -1
mod_end = -1
for i, line in enumerate(lines):
    if 'function ContentModeration' in line:
        mod_start = i
        break

if mod_start != -1:
    # Find next function (UsersManager starts at line 1765 usually)
    for i in range(mod_start + 1, len(lines)):
        if 'function UsersManager' in lines[i]:
            mod_end = i
            break
    
    if mod_end != -1:
        print(f"Replacing ContentModeration from {mod_start+1} to {mod_end}")
        lines[mod_start:mod_end] = new_moderation

with open(file_path, 'w') as f:
    f.writelines(lines)
