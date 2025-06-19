import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

type HouseholdMember = Database["public"]["Tables"]["household_members"]["Row"];

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchHouseholdId = async (userId: string) => {
      try {
        const { data, error: householdError } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", userId)
          .single();

        if (householdError) {
          console.error("Error fetching household:", householdError);
          if (isMounted) {
            setError(householdError.message);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setHouseholdId(data?.household_id || null);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in fetchHouseholdId:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred"
          );
          setLoading(false);
        }
      }
    };

    // Get initial user
    const initializeUser = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error fetching user:", userError);
          if (isMounted) {
            setError(userError.message);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setUser(user);
          if (user) {
            await fetchHouseholdId(user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Error in initializeUser:", err);
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchHouseholdId(session.user.id);
        } else {
          setHouseholdId(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("useUser state:", { user, householdId, loading, error });
  }, [user, householdId, loading, error]);

  return { user, householdId, loading, error };
}
