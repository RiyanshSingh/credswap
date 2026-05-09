import os
import re

supabase_dir = "supabase"
migrations_dir = "supabase/migrations"

# 1. Collect all potential source files
supabase_files = [os.path.join(supabase_dir, f) for f in os.listdir(supabase_dir) if f.endswith(".sql")]
exclude = ["check_events.sql", "FINAL_and_TESTED_chat_fix.sql"]
supabase_files = [f for f in supabase_files if os.path.basename(f) not in exclude]

migrations_backup_dir = "supabase/migrations_backup"
if os.path.exists(migrations_backup_dir):
    migration_files = [os.path.join(migrations_backup_dir, f) for f in os.listdir(migrations_backup_dir) if f.endswith(".sql")]
else:
    migration_files = [os.path.join(migrations_dir, f) for f in os.listdir(migrations_dir) if f.endswith(".sql") and "initial_foundation" not in f]

all_files = supabase_files + migration_files

def fix_policy(match):
    policy_name = match.group(1)
    table_name = match.group(2)
    return f"DROP POLICY IF EXISTS \"{policy_name}\" ON {table_name};\nCREATE POLICY \"{policy_name}\" ON {table_name}"

output_file = "supabase/migrations/20230101000000_initial_foundation.sql"

with open(output_file, "w") as outfile:
    outfile.write("-- AUTOMATICALLY GENERATED COMPREHENSIVE FOUNDATION MIGRATION V18\n")
    outfile.write("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";\n\n")
    
    preferred = ["schema.sql", "setup_admin.sql", "add_marketplace.sql", "add_secure_marketplace.sql"]
    sorted_files = sorted(all_files, key=lambda x: (0 if os.path.basename(x) in preferred else 1, x))
    
    for path in sorted_files:
        if "initial_foundation" in os.path.basename(path): continue
        if not os.path.exists(path): continue
        with open(path, "r") as infile:
            content = infile.read()
            content = content.replace('uuid_generate_v4()', 'gen_random_uuid()')
            content = re.sub(r'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', '', content, flags=re.IGNORECASE)
            content = re.sub(r'CREATE POLICY\s+"([^"]+)"\s+ON\s+([\w\.]+)', fix_policy, content, flags=re.IGNORECASE)
            content = re.sub(r'CREATE POLICY\s+([\w]+)\s+ON\s+([\w\.]+)', fix_policy, content, flags=re.IGNORECASE)
            content = re.sub(r'DROP TABLE IF EXISTS\s+([\w\.]+)(?! CASCADE)', r'DROP TABLE IF EXISTS \1 CASCADE', content, flags=re.IGNORECASE)
            
            outfile.write(f"\n\n-- ==========================================\n")
            outfile.write(f"-- Source: {path}\n")
            outfile.write(f"-- ==========================================\n")
            outfile.write(content)

print(f"Created comprehensive foundation migration V18: {output_file}")
