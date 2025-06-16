import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing env.SUPABASE_SERVICE_ROLE_KEY");
}

// Create a Supabase client with the service role key for server-side operations
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create a Supabase client with the user's session for server-side operations
export async function createServerClient() {
  const cookieStore = cookies();
  const supabaseAccessToken =
    cookieStore.get("supabase-access-token")?.value ?? "";
  const supabaseRefreshToken =
    cookieStore.get("supabase-refresh-token")?.value ?? "";

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: supabaseAccessToken
            ? `Bearer ${supabaseAccessToken}`
            : "",
        },
      },
    }
  );
}

// Helper to get the current user's session on the server
export async function getServerSession() {
  const supabase = await createServerClient();
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
