import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const incomeSourceSchema = z.object({
  householdId: z.string(),
  primaryIncome: z.object({
    name: z.string().min(1),
    amount: z.number().min(0),
    scheduleType: z.enum(["semi_monthly", "bi_weekly", "monthly", "one_time"]),
    biWeeklyDay: z
      .enum([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ])
      .optional(),
    biWeeklyStartDate: z.string().optional(),
    monthlyDay: z.number().optional(),
  }),
  secondaryIncomes: z.array(
    z.object({
      name: z.string().min(1),
      amount: z.number().min(0),
      scheduleType: z.enum([
        "semi_monthly",
        "bi_weekly",
        "monthly",
        "one_time",
      ]),
      biWeeklyDay: z
        .enum([
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ])
        .optional(),
      biWeeklyStartDate: z.string().optional(),
      monthlyDay: z.number().optional(),
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
      schedule_type: income.scheduleType,
      bi_weekly_day: income.biWeeklyDay || null,
      bi_weekly_start_date: income.biWeeklyStartDate || null,
      monthly_day: income.monthlyDay || null,
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
