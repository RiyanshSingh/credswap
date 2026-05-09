import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const testTable = async () => {
  const { data: users, error: ue } = await supabase.auth.admin?.listUsers() ?? await supabase.from('profiles').select('id').limit(1);
  if (users && users.length > 0) {
     const userId = users[0].id;
     console.log("Found user:", userId);
     const { error } = await supabase.from('attendance_records').upsert(
       { user_id: userId, date: '2026-03-01', status: 'present' },
       { onConflict: 'user_id, date' }
     );
     console.log("Upsert Error:", error ? JSON.stringify(error) : "None");
     
     // Clean up
     await supabase.from('attendance_records').delete().eq('user_id', userId).eq('date', '2026-03-01');
  } else {
     console.log("No user found.");
  }
}
testTable();
