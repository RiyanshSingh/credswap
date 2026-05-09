import { createClient } from "@supabase/supabase-js";

// Grab directly from .env using regex
import { readFileSync } from 'fs';
const envFile = readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseAnonKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testTable = async () => {
  const { error } = await supabase.from('attendance_records').select('date').limit(1);
  console.log("Select Error:", error ? error.message : "None");
}
testTable();
