import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTables() {
  const { data, error } = await supabase.from('user_roadmaps').select('*').limit(1);
  console.log('user_roadmaps:', error ? error.message : 'EXISTS');
  const { data: d2, error: e2 } = await supabase.from('roadmap_enrollments').select('*').limit(1);
  console.log('roadmap_enrollments:', e2 ? e2.message : 'EXISTS');
}
checkTables();
