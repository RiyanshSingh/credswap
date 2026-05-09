import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

async function run() {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('attendance_records').select('*').limit(5);
    console.log("Anon key select attendance_records:", JSON.stringify(data), !!error ? error : "");
}
run();
