import { supabase } from "./supabase";

/**
 * Logs a user activity to the database.
 * @param userId - The UUID of the user.
 * @param action - Short description of the action (e.g., "Logged In").
 * @param details - Optional details about the action.
 */
export async function logActivity(userId: string, action: string, details?: string) {
    try {
        const { error } = await supabase.from('activities').insert({
            user_id: userId,
            action,
            details,
        });

        if (error) {
            console.error("Failed to log activity:", error);
        } else {
            console.log(`Activity logged: ${action}`);
        }
    } catch (err) {
        console.error("Error logging activity:", err);
    }
}
