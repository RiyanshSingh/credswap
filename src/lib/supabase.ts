/**
 * @file Supabase Client Initialization
 * @description Configures and exports the singleton Supabase client instance with session persistence
 * and environment variable fallbacks.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder";

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

