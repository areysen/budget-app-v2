import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's household
    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("id")
      .eq("created_by", user.id)
      .single();

    if (householdError || !household) {
      return NextResponse.json(
        { error: "Household not found" },
        { status: 404 }
      );
    }

    // Reset budget setup state
    const { error: updateError } = await supabase
      .from("households")
      .update({ budget_setup_complete: false })
      .eq("id", household.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update household" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting budget setup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
