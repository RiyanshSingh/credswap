import os
import re

# Refined Foundational order (V13)
foundational = [
    "schema.sql",
    "setup_admin.sql",
    "universal_admin_fix.sql",
    "add_admin_recovery.sql",
    "add_marketplace.sql",
    "add_secure_marketplace.sql",
    "add_messaging_system.sql",
    "add_opportunities_schema.sql",
    "add_p2p_tasks_schema.sql",
    "add_earn_feature.sql",
    "update_tasks_schema.sql",
    "add_task_disputes.sql",
    "add_task_dispute_messages.sql",
    "add_task_dispute_notifications.sql",
    "add_event_registrations.sql",
    "add_notifications.sql",
    "add_push_subscriptions.sql",
    "add_community_feature.sql",
    "add_community_interactions.sql",
    "add_lost_and_found.sql",
    "migrations/20260316000000_create_roadmaps.sql", # Added roadmaps from migrations
    "roadmap_cloud_sync.sql",
    "add_room_rentals.sql",
    "add_user_downloads.sql",
    "update_settings_wallet_schema.sql",
    "create_activities_table.sql",
    "create_marketplace_bucket.sql",
    "storage.sql"
]

all_sql_files = [f for f in os.listdir("supabase") if f.endswith(".sql")]
for f in all_sql_files:
    if f.startswith("add_") and f not in foundational:
        foundational.append(f)

output_file = "supabase/migrations/20230101000000_initial_foundation.sql"

def fix_policy(match):
    policy_name = match.group(1)
    table_name = match.group(2)
    return f"DROP POLICY IF EXISTS \"{policy_name}\" ON {table_name};\nCREATE POLICY \"{policy_name}\" ON {table_name}"

with open(output_file, "w") as outfile:
    outfile.write("-- AUTOMATICALLY GENERATED COMPREHENSIVE FOUNDATION MIGRATION V13\n")
    outfile.write("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";\n\n")
    
    for filename in foundational:
        path = os.path.join("supabase", filename)
        if os.path.exists(path):
            with open(path, "r") as infile:
                outfile.write(f"\n\n-- ==========================================\n")
                outfile.write(f"-- Source: {filename}\n")
                outfile.write(f"-- ==========================================\n")
                content = infile.read()
                content = content.replace('create extension if not exists "uuid-ossp";', '')
                content = content.replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', '')
                content = content.replace('uuid_generate_v4()', 'gen_random_uuid()')
                content = re.sub(r'CREATE POLICY\s+"([^"]+)"\s+ON\s+([\w\.]+)', fix_policy, content, flags=re.IGNORECASE)
                content = re.sub(r'CREATE POLICY\s+([\w]+)\s+ON\s+([\w\.]+)', fix_policy, content, flags=re.IGNORECASE)
                outfile.write(content)

print(f"Created comprehensive foundation migration V13: {output_file}")
