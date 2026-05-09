import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTasks() {
  const { data, error, count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact' });

  if (error) {
    console.error("Error fetching tasks:", error.message);
  } else {
    console.log(`Total tasks found: ${count}`);
    console.log("Tasks:", data.map(t => t.title));
  }
}

checkTasks();
