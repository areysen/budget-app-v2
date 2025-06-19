// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";

// Create the browser client using SSR-compatible method
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Export a singleton instance for backwards compatibility
export const supabase = createClient();

// Helper to get the current user's household ID
export async function getUserHousehold(userId: string): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data?.household_id ?? null;
  } catch (error) {
    console.error("Error fetching user household:", error);
    return null;
  }
}

// Helper to check if user has access to a household
export async function hasHouseholdAccess(
  userId: string,
  householdId: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("household_members")
      .select("id")
      .eq("user_id", userId)
      .eq("household_id", householdId)
      .single();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error("Error checking household access:", error);
    return false;
  }
}
