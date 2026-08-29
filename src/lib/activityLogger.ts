/**
 * @file Activity Logger
 * @description Provides structured audit logging for user interactions, authentications,
 * and listing actions in the CredSwap ecosystem.
 */

import { supabase } from "./supabase";

/**
 * Logs a user activity to the database for administrative and auditing purposes.
 * @param userId - The UUID of the user performing the action.
 * @param action - Short categorical description of the action (e.g., "Logged In", "Created Listing").
 * @param details - Optional metadata or human-readable details about the action.
 */
export async function logActivity(userId: string, action: string, details?: string): Promise<void> {
    if (!userId) return;

    try {
        const { error } = await supabase.from('activities').insert({
            user_id: userId,
            action,
            details,
        });

        if (error) {
            console.warn("Failed to record activity log:", error.message);
        }
    } catch (err) {
        console.warn("Activity logger encountered an exception:", err);
    }
}

