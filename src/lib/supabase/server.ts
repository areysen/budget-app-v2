import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export const createServerSupabaseClient = () => {
  const cookieStorePromise = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookieStorePromise;
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = await cookieStorePromise;
            cookieStore.set({ name, value, ...options });
          } catch {
            // Only allowed in Server Components or Route Handlers
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = await cookieStorePromise;
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Only allowed in Server Components or Route Handlers
          }
        },
      },
    }
  );
};

// Helper to get the current user's session on the server
export async function getServerSession() {
  const supabase = await createServerSupabaseClient();
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;
    return session;
  } catch (error) {
    console.error("Error getting server session:", error);
    return null;
  }
}
