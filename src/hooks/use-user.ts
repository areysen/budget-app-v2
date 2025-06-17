import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

type HouseholdMember = Database["public"]["Tables"]["household_members"]["Row"];

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Get user's household
        supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", user.id)
          .single()
          .then(({ data }) => {
            if (data?.household_id) {
              setHouseholdId(data.household_id);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Get user's household on auth change
        supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.household_id) {
              setHouseholdId(data.household_id);
            }
          });
      } else {
        setHouseholdId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log("useUser state:", { user, householdId, loading });
  }, [user, householdId, loading]);

  return { user, householdId, loading };
}
