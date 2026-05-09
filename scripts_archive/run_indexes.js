require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const fs = require('fs');
const sql = fs.readFileSync('supabase/migrations/20250307_performance_indexes.sql', 'utf8');
console.log(sql);
