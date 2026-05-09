import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('opportunities').select('*').limit(1);
  console.log('Opportunities Error:', error);
  console.log('Columns example:', data && data[0] ? Object.keys(data[0]) : 'None');
}
check();
