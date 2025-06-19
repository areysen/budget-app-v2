import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const incomeSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(0, "Amount must be positive"),
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
    .nullable(),
  frequency_config: z.any().nullable(),
  anchor_date: z.string().nullable(),
  next_payment_date: z.string().nullable(),
  is_primary: z.boolean(),
});

const createIncomeSourceSchema = z.object({
  householdId: z.string(),
  ...incomeSourceSchema.omit({ is_primary: true }).shape,
  is_primary: z.boolean(),
});

const updateIncomeSourceSchema = z.object({
  id: z.string(),
  household_id: z.string(),
  ...incomeSourceSchema.shape,
});

// GET - Fetch income sources for household
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get("householdId");

    if (!householdId) {
      return NextResponse.json(
        { error: "householdId is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: incomeSources, error } = await supabase
      .from("income_sources")
      .select("*")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Separate primary and secondary incomes
    const primaryIncome = incomeSources.find((income) => income.is_primary);
    const secondaryIncomes = incomeSources.filter(
      (income) => !income.is_primary
    );

    return NextResponse.json({
      primaryIncome,
      secondaryIncomes,
    });
  } catch (error) {
    console.error("Error fetching income sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch income sources" },
      { status: 500 }
    );
  }
}

// POST - Create new income source
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const json = await request.json();
    const data = createIncomeSourceSchema.parse(json);

    // If this is a primary income, ensure no other primary exists
    if (data.is_primary) {
      const { data: existingPrimary } = await supabase
        .from("income_sources")
        .select("id")
        .eq("household_id", data.householdId)
        .eq("is_primary", true)
        .eq("is_active", true)
        .single();

      if (existingPrimary) {
        return NextResponse.json(
          {
            error: "A primary income source already exists for this household",
          },
          { status: 400 }
        );
      }
    }

    const incomeSourceData = {
      household_id: data.householdId,
      name: data.name,
      amount: data.amount,
      frequency_type: data.frequency_type,
      frequency_config: data.frequency_config,
      anchor_date: data.anchor_date,
      next_payment_date: data.next_payment_date,
      is_primary: data.is_primary,
      is_active: true,
    };

    const { data: newIncomeSource, error } = await supabase
      .from("income_sources")
      .insert(incomeSourceData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ incomeSource: newIncomeSource });
  } catch (error) {
    console.error("Error creating income source:", error);
    return NextResponse.json(
      { error: "Failed to create income source" },
      { status: 500 }
    );
  }
}

// PUT - Update existing income source
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const json = await request.json();
    const data = updateIncomeSourceSchema.parse(json);

    // If this is a primary income, ensure no other primary exists
    if (data.is_primary) {
      const { data: existingPrimary } = await supabase
        .from("income_sources")
        .select("id")
        .eq("household_id", data.household_id)
        .eq("is_primary", true)
        .eq("is_active", true)
        .neq("id", data.id)
        .single();

      if (existingPrimary) {
        return NextResponse.json(
          {
            error: "A primary income source already exists for this household",
          },
          { status: 400 }
        );
      }
    }

    const updateData = {
      name: data.name,
      amount: data.amount,
      frequency_type: data.frequency_type,
      frequency_config: data.frequency_config,
      anchor_date: data.anchor_date,
      next_payment_date: data.next_payment_date,
      is_primary: data.is_primary,
    };

    const { data: updatedIncomeSource, error } = await supabase
      .from("income_sources")
      .update(updateData)
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ incomeSource: updatedIncomeSource });
  } catch (error) {
    console.error("Error updating income source:", error);
    return NextResponse.json(
      { error: "Failed to update income source" },
      { status: 500 }
    );
  }
}

// DELETE - Delete income source (hard delete during setup)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const householdId = searchParams.get("householdId");

    if (!id || !householdId) {
      return NextResponse.json(
        { error: "Income source ID and household ID are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

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

    // Check if this is a primary income source
    const { data: incomeSource } = await supabase
      .from("income_sources")
      .select("is_primary")
      .eq("id", id)
      .eq("household_id", householdId)
      .single();

    if (incomeSource?.is_primary) {
      return NextResponse.json(
        { error: "Cannot delete primary income source" },
        { status: 400 }
      );
    }

    // Hard delete the income source
    const { error } = await supabase
      .from("income_sources")
      .delete()
      .eq("id", id)
      .eq("household_id", householdId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting income source:", error);
    return NextResponse.json(
      { error: "Failed to delete income source" },
      { status: 500 }
    );
  }
}
