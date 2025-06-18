import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const fixedExpenseSchema = z.object({
  householdId: z.string(),
  expenses: z.array(
    z.object({
      name: z.string().min(1),
      amount: z.number().min(0),
      dueDay: z.number().min(1).max(31),
      frequency: z.enum(["monthly", "bi-weekly"]),
      isVariable: z.boolean(),
      category: z.string().min(1),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const json = await request.json();
    const data = fixedExpenseSchema.parse(json);

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

    // Create fixed expenses
    const { error: fixedExpensesError } = await supabase
      .from("fixed_expenses")
      .insert(
        data.expenses.map((expense) => ({
          household_id: data.householdId,
          name: expense.name,
          estimated_amount: expense.amount,
          due_day: expense.dueDay,
          frequency: expense.frequency,
          is_variable: expense.isVariable,
          category: expense.category,
          is_active: true,
        }))
      );

    if (fixedExpensesError) throw fixedExpensesError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving fixed expenses:", error);
    return NextResponse.json(
      { error: "Failed to save fixed expenses" },
      { status: 500 }
    );
  }
}
