import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Helper to get the current user's household ID
export async function getUserHousehold(userId: string): Promise<string | null> {
  try {
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
