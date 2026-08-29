/**
 * @file Supabase Client Initialization
 * @description Configures and exports the singleton Supabase client instance with session persistence
 * and environment variable fallbacks.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://xvwnlphunbinbinbjspr.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d25scGh1bmJpbmJqc3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjkyOTAsImV4cCI6MjA5MzkwNTI5MH0.3-5Bragd-cR40tPwv1vsr4j8HD9crMl_Ld6k_Osuyj0";


/**
 * Singleton Supabase client for all database, auth, storage, and realtime operations.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
    },
});

