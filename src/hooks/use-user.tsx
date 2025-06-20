"use client";

// src/hooks/use-user.ts
import {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
  PropsWithChildren,
} from "react";
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

const UserContext = createContext<UseUserReturn | undefined>(undefined);

export const UserProvider = ({ children }: PropsWithChildren<{}>) => {
  const [user, setUser] = useState<User | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("householdId");
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHouseholdId = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.warn(
          "No household found for user, clearing from storage:",
          error.message
        );
        localStorage.removeItem("householdId");
        setHouseholdId(null);
        return;
      }

      if (data?.household_id) {
        if (localStorage.getItem("householdId") !== data.household_id) {
          localStorage.setItem("householdId", data.household_id);
        }
        setHouseholdId(data.household_id);
      }
    } catch (err) {
      console.error("Error fetching household:", err);
      setError("Failed to fetch household details.");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeUser = async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchHouseholdId(currentUser.id);
        } else {
          localStorage.removeItem("householdId");
          setHouseholdId(null);
        }
        setLoading(false);
      }
    };

    initializeUser();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchHouseholdId(currentUser.id);
        }
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
        setHouseholdId(null);
        localStorage.removeItem("householdId");
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchHouseholdId]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "householdId") {
        setHouseholdId(event.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const value = { user, householdId, loading, error };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
