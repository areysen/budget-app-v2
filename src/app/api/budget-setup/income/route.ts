import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const incomeSourceSchema = z.object({
  householdId: z.string(),
  primaryIncome: z.object({
    name: z.string().min(1),
    amount: z.number().min(0),
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
    frequency_config: z.any().nullable().optional(),
    anchor_date: z.string().nullable().optional(),
    next_due_date: z.string().nullable().optional(),
    next_payment_date: z.string().nullable().optional(),
  }),
  secondaryIncomes: z.array(
    z.object({
      name: z.string().min(1),
      amount: z.number().min(0),
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
      frequency_config: z.any().nullable().optional(),
      anchor_date: z.string().nullable().optional(),
      next_due_date: z.string().nullable().optional(),
      next_payment_date: z.string().nullable().optional(),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const json = await request.json();
    const data = incomeSourceSchema.parse(json);

    // Combine primary and secondary incomes
    const allIncomes = [data.primaryIncome, ...data.secondaryIncomes];

    // Map to income_sources table structure
    const incomeSourcesData = allIncomes.map((income) => ({
      household_id: data.householdId,
      name: income.name,
      amount: income.amount,
      frequency_type: income.frequency_type,
      frequency_config: income.frequency_config,
      anchor_date: income.anchor_date,
      next_payment_date: income.next_payment_date,
      is_active: true,
    }));

    // Insert into income_sources
    const { error } = await supabase
      .from("income_sources")
      .insert(incomeSourcesData);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving income sources:", error);
    return NextResponse.json(
      { error: "Failed to save income sources" },
      { status: 500 }
    );
  }
}
