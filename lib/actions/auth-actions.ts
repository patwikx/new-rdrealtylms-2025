"use server";

import { signOut } from "@/auth";
import { logUserLogout } from "./audit-log-actions";

/**
 * Sign out the current user and log the logout event
 */
export async function signOutWithAudit(userId: string) {
  try {
    // Log the logout event before signing out
    await logUserLogout(userId);
    
    // Sign out the user
    await signOut({ redirectTo: "/auth/sign-in" });
  } catch (error) {
    console.error("Error during sign out:", error);
    // Still try to sign out even if audit log fails
    await signOut({ redirectTo: "/auth/sign-in" });
  }
}
