
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://jmgqqkyjulgbyhubfacu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZ3Fxa3lqdWxnYnlodWJmYWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjE1NzMsImV4cCI6MjA4MTUzNzU3M30.kU5VrcULi40ZgP8o0AS4NEKs4ahw0gIezBT1QLj8WwU'
);

async function check() {
    const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('All Recent Transactions:', JSON.stringify(data, null, 2));
    }
}

check();
