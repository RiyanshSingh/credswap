
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://jmgqqkyjulgbyhubfacu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZ3Fxa3lqdWxnYnlodWJmYWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjE1NzMsImV4cCI6MjA4MTUzNzU3M30.kU5VrcULi40ZgP8o0AS4NEKs4ahw0gIezBT1QLj8WwU'
);

async function check() {
    const txId = '29c88f33-f543-4746-9116-ab949e8ae0a8'; // ID from previous debug output
    console.log('Fetching transaction:', txId);

    const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', txId)
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Found Transaction:', JSON.stringify(data, null, 2));
    }
}

check();
