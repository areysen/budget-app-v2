// src/hooks/use-user.ts
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

type HouseholdMember = Database["public"]["Tables"]["household_members"]["Row"];

interface UseUserReturn {
  user: User | null;
  householdId: string | null;
  loading: boolean;
  error: string | null;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchHouseholdId = async (userId: string) => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", userId)
          .single();

        if (error) {
          console.warn("No household found for user:", error.message);
          if (isMounted) {
            setHouseholdId(null);
          }
          return;
        }

        if (data?.household_id && isMounted) {
          setHouseholdId(data.household_id);
        }
      } catch (err) {
        console.error("Error fetching household:", err);
        if (isMounted) {
          setHouseholdId(null);
        }
      }
    };

    const initializeUser = async () => {
      try {
        const supabase = createClient();

        // Get initial user session
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error getting user:", userError);
          if (isMounted) {
            setError("Failed to get user session");
            setUser(null);
            setHouseholdId(null);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setUser(user);
        }

        if (user) {
          await fetchHouseholdId(user.id);
        }

        if (isMounted) {
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Unexpected error in initializeUser:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred"
          );
          setLoading(false);
        }
      }
    };

    initializeUser();

    // Listen for auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchHouseholdId(session.user.id);
        } else {
          setHouseholdId(null);
        }
        setLoading(false);
        setError(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("useUser state:", {
      user: !!user,
      householdId,
      loading,
      error,
      userId: user?.id,
    });
  }, [user, householdId, loading, error]);

  return { user, householdId, loading, error };
}
