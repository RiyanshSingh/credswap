import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch() {
  const { data, error } = await supabase.rpc('search_content', { query_text: 'test' });
  console.log('Error:', error);
  console.log('Result:', data);
}

testSearch();
