import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const testTable = async () => {
  const { data, error } = await supabase.from('attendance_records').select('date').limit(1);
  console.log("Error:", error?.message);
}
testTable();
