import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const fixedExpenseSchema = z.object({
  householdId: z.string(),
  expenses: z.array(
    z.object({
      name: z.string().min(1),
      amount: z.number().min(0),
      isVariable: z.boolean(),
      category: z.string().min(1),
      notes: z.string().optional(),

      // Enhanced frequency fields
      frequency_type: z
        .enum([
          "monthly",
          "biweekly",
          "weekly",
          "semi_monthly",
          "quarterly",
          "yearly",
          "per_paycheck",
        ])
        .nullable()
        .optional(),
      frequency_config: z.any().nullable().optional(), // JSON config object
      anchor_date: z.string().nullable().optional(),
      next_due_date: z.string().nullable().optional(),

      // Backward compatibility
      dueDay: z.number().min(1).max(31).optional(),
      frequency: z.enum(["monthly", "quarterly", "annual"]).optional(),
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
          is_variable: expense.isVariable,
          category: expense.category,
          notes: expense.notes,

          // Enhanced frequency system
          frequency_type: expense.frequency_type,
          frequency_config: expense.frequency_config,
          anchor_date: expense.anchor_date,
          next_due_date: expense.next_due_date,

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
