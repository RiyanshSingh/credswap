const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    const { data: d0, error: e0 } = await supabase.from('conversations').select('*, participant1:participant1_id(id, full_name, avatar_url)').limit(1);
    console.log("With original syntax:", JSON.stringify({d0, e0}, null, 2));

    const { data, error } = await supabase.from('conversations').select('*, participant1:profiles!conversations_participant1_id_fkey(id, full_name, avatar_url)').limit(1);
    console.log("With constraint:", JSON.stringify({data, error}, null, 2));

    const { data: d2, error: e2 } = await supabase.from('conversations').select('*, participant1:profiles!participant1_id(id, full_name, avatar_url)').limit(1);
    console.log("With column:", JSON.stringify({d2, e2}, null, 2));
}
run();
