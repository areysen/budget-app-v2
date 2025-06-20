import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { envelopes, household_id } = await request.json();

  if (!envelopes || !household_id) {
    return new Response("Missing envelopes or household_id", { status: 400 });
  }

  const envelopesToInsert = envelopes.map((e: any) => ({
    ...e,
    household_id,
    is_active: true,
  }));

  try {
    const { data, error } = await supabase
      .from("envelopes")
      .insert(envelopesToInsert)
      .select();

    if (error) {
      console.error("Error inserting envelopes:", error);
      return new Response("Failed to insert envelopes", { status: 500 });
    }

    return NextResponse.json({ envelopes: data });
  } catch (error) {
    console.error("Error:", error);
    return new Response("An unexpected error occurred", { status: 500 });
  }
}
