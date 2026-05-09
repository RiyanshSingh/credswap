
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://jmgqqkyjulgbyhubfacu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZ3Fxa3lqdWxnYnlodWJmYWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjE1NzMsImV4cCI6MjA4MTUzNzU3M30.kU5VrcULi40ZgP8o0AS4NEKs4ahw0gIezBT1QLj8WwU'
);

// Fetch the most recent order and its transaction
async function check() {
    const { data: order, error } = await supabase
        .from('marketplace_orders')
        .select('*, payment_transactions(*)')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching order:', error);
        // Fallback: fetch orders without join
        const { data: rawOrder } = await supabase
            .from('marketplace_orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        console.log('Raw Order:', rawOrder);

        if (rawOrder?.transaction_ref) {
            const { data: txn } = await supabase.from('payment_transactions').select('*').eq('id', rawOrder.transaction_ref).single();
            console.log('Linked Transaction:', txn);
        }
    } else {
        console.log('Order with Transaction:', JSON.stringify(order, null, 2));
    }
}

check();
