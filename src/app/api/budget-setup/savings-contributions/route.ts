import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const savingsContributionSchema = z.object({
  householdId: z.string(),
  paycheckPeriodId: z.string(),
  contributions: z.array(
    z.object({
      savingsGoalId: z.string(),
      amount: z.number().min(0),
      contributionType: z.enum(["planned", "overflow", "roundup"]),
      description: z.string().optional(),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const json = await request.json();
    const data = savingsContributionSchema.parse(json);

    // Verify user has access to this household
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: member } = await supabase
      .from("household_members")
      .select("id")
      .eq("household_id", data.householdId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create savings contributions
    const { error: contributionsError } = await supabase
      .from("savings_contributions")
      .insert(
        data.contributions.map((contribution) => ({
          household_id: data.householdId,
          savings_goal_id: contribution.savingsGoalId,
          paycheck_period_id: data.paycheckPeriodId,
          amount: contribution.amount,
          contribution_type: contribution.contributionType,
          description: contribution.description || null,
          created_by: user.id,
          updated_by: user.id,
        }))
      );

    if (contributionsError) throw contributionsError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving savings contributions:", error);
    return NextResponse.json(
      { error: "Failed to save savings contributions" },
      { status: 500 }
    );
  }
}
