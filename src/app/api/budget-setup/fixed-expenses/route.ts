import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const fixedExpenseSchema = z.object({
  householdId: z.string(),
  expenses: z.array(
    z.object({
      id: z.string().optional(),
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

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get("householdId");

    if (!householdId) {
      return NextResponse.json(
        { error: "Household ID is required" },
        { status: 400 }
      );
    }

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
      .eq("household_id", householdId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch fixed expenses
    const { data: expenses, error } = await supabase
      .from("fixed_expenses")
      .select(
        "id, name, category, estimated_amount, is_variable, notes, frequency_type, frequency_config, anchor_date, next_due_date"
      )
      .eq("household_id", householdId)
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    // Transform data to match frontend interface
    const transformedExpenses =
      expenses?.map((expense) => ({
        id: expense.id,
        name: expense.name,
        category: expense.category,
        amount: expense.estimated_amount,
        isVariable: expense.is_variable,
        notes: expense.notes,
        frequency_type: expense.frequency_type,
        frequency_config: expense.frequency_config,
        anchor_date: expense.anchor_date,
        next_due_date: expense.next_due_date,
      })) || [];

    return NextResponse.json({ expenses: transformedExpenses });
  } catch (error) {
    console.error("Error loading fixed expenses:", error);
    return NextResponse.json(
      { error: "Failed to load fixed expenses" },
      { status: 500 }
    );
  }
}

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
    const { data: savedExpenses, error: fixedExpensesError } = await supabase
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
      )
      .select();

    if (fixedExpensesError) throw fixedExpensesError;

    // Return the saved expense for single expense creation
    if (data.expenses.length === 1) {
      const savedExpense = savedExpenses?.[0];
      if (savedExpense) {
        return NextResponse.json({
          id: savedExpense.id,
          name: savedExpense.name,
          category: savedExpense.category,
          amount: savedExpense.estimated_amount,
          isVariable: savedExpense.is_variable,
          notes: savedExpense.notes,
          frequency_type: savedExpense.frequency_type,
          frequency_config: savedExpense.frequency_config,
          anchor_date: savedExpense.anchor_date,
          next_due_date: savedExpense.next_due_date,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving fixed expenses:", error);
    return NextResponse.json(
      { error: "Failed to save fixed expenses" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get("householdId");
    const id = searchParams.get("id");

    if (!householdId || !id) {
      return NextResponse.json(
        { error: "Household ID and expense ID are required" },
        { status: 400 }
      );
    }

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
      .eq("household_id", householdId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hard delete the fixed expense
    const { error: deleteError } = await supabase
      .from("fixed_expenses")
      .delete()
      .eq("id", id)
      .eq("household_id", householdId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting fixed expense:", error);
    return NextResponse.json(
      { error: "Failed to delete fixed expense" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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

    // Update the fixed expense
    const expense = data.expenses[0];

    if (!expense.id) {
      return NextResponse.json(
        { error: "Expense ID is required for updates" },
        { status: 400 }
      );
    }

    const { data: updatedExpense, error: updateError } = await supabase
      .from("fixed_expenses")
      .update({
        name: expense.name,
        estimated_amount: expense.amount,
        is_variable: expense.isVariable,
        category: expense.category,
        notes: expense.notes,
        frequency_type: expense.frequency_type,
        frequency_config: expense.frequency_config,
        anchor_date: expense.anchor_date,
        next_due_date: expense.next_due_date,
      })
      .eq("id", expense.id)
      .eq("household_id", data.householdId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      id: updatedExpense.id,
      name: updatedExpense.name,
      category: updatedExpense.category,
      amount: updatedExpense.estimated_amount,
      isVariable: updatedExpense.is_variable,
      notes: updatedExpense.notes,
      frequency_type: updatedExpense.frequency_type,
      frequency_config: updatedExpense.frequency_config,
      anchor_date: updatedExpense.anchor_date,
      next_due_date: updatedExpense.next_due_date,
    });
  } catch (error) {
    console.error("Error updating fixed expense:", error);
    return NextResponse.json(
      { error: "Failed to update fixed expense" },
      { status: 500 }
    );
  }
}
