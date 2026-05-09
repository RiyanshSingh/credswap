import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  console.log("Testing notes query with profiles join...");
  const { data, error } = await supabase
    .from('notes')
    .select('*, profiles(full_name, avatar_url)')
    .limit(5);

  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Success! Fetched", data?.length, "notes.");
    if (data && data.length > 0) {
        console.log("First note profile:", data[0].profiles);
    }
  }
}

testFetch();
