import re

files_to_process = [
    "src/components/CompanyOpportunitiesManager.tsx"
]

for file_path in files_to_process:
    with open(file_path, "r") as f:
        content = f.read()

    # Improve Dialog Content
    old_dialog = 'className="max-w-5xl p-0 overflow-hidden bg-white dark:bg-slate-900 border-none shadow-2xl"'
    new_dialog = 'className="max-w-5xl p-0 overflow-hidden bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800/80 shadow-[0_0_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_0_100px_-20px_rgba(79,70,229,0.15)] sm:rounded-[2rem]"'
    content = content.replace(old_dialog, new_dialog)

    # Improve Dialog Header
    old_header = 'className="px-6 py-6 bg-slate-900 dark:bg-black text-white"'
    new_header = 'className="px-8 py-8 bg-gradient-to-br from-indigo-950 via-[#0B1120] to-black text-white relative overflow-hidden border-b border-white/5"'
    content = content.replace(old_header, new_header)

    # Improve Dialog Title
    old_title = 'className="text-xl font-bold"'
    new_title = 'className="text-2xl font-black tracking-tight"'
    content = content.replace(old_title, new_title)

    # Improve Dialog Description
    old_desc = 'className="text-slate-400"'
    new_desc = 'className="text-indigo-200/70 font-medium"'
    content = content.replace(old_desc, new_desc)

    # Also apply to AdminDashboard.tsx for OpportunitiesManager
    with open(file_path, "w") as f:
        f.write(content)

with open("src/pages/AdminDashboard.tsx", "r") as f:
    admin_content = f.read()
    admin_content = admin_content.replace(old_dialog, new_dialog)
    admin_content = admin_content.replace(old_header, new_header)

with open("src/pages/AdminDashboard.tsx", "w") as f:
    f.write(admin_content)

print("Dialog styling upgraded.")
