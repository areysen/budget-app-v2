import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const savingsGoalSchema = z.object({
  householdId: z.string(),
  goals: z.array(
    z.object({
      name: z.string().min(1),
      targetAmount: z.number().min(0),
      targetDate: z.string().optional(),
      isEmergencyFund: z.boolean(),
      isRoundupTarget: z.boolean(),
      description: z.string().optional(),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const json = await request.json();
    const data = savingsGoalSchema.parse(json);

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

    // Create savings goals
    const { error: goalsError } = await supabase.from("savings_goals").insert(
      data.goals.map((goal, index) => ({
        household_id: data.householdId,
        name: goal.name,
        target_amount: goal.targetAmount,
        target_date: goal.targetDate || null,
        is_emergency_fund: goal.isEmergencyFund,
        is_roundup_target: goal.isRoundupTarget,
        description: goal.description || null,
        is_active: true,
        sort_order: index,
        current_balance: 0,
      }))
    );

    if (goalsError) throw goalsError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving savings goals:", error);
    return NextResponse.json(
      { error: "Failed to save savings goals" },
      { status: 500 }
    );
  }
}
