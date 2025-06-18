import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: household, error: householdError } = await supabase
    .from("households")
    .select("id")
    .eq("created_by", user.id)
    .single();

  if (householdError || !household) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 });
  }

  return NextResponse.json({ householdId: household.id });
}
