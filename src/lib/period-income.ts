// lib/period-income.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export async function addIncomeToPeriod(
  supabase: SupabaseClient,
  periodId: string,
  income: {
    source_name: string;
    amount: number;
    expected_date: string;
    is_confirmed: boolean;
  }
) {
  // 1. Insert income row
  const { error: insertError } = await supabase.from("period_income").insert({
    period_id: periodId,
    source_name: income.source_name,
    amount: income.amount,
    expected_date: income.expected_date,
    is_confirmed: income.is_confirmed,
  });
  if (insertError) throw insertError;

  // 2. Update period's total_income (sum of confirmed incomes)
  const { data: incomes, error: incomeError } = await supabase
    .from("period_income")
    .select("amount")
    .eq("period_id", periodId)
    .eq("is_confirmed", true);
  if (incomeError) throw incomeError;
  const total = (incomes ?? []).reduce((sum, i) => sum + (i.amount ?? 0), 0);
  const { error: updateError } = await supabase
    .from("paycheck_periods")
    .update({ total_income: total })
    .eq("id", periodId);
  if (updateError) throw updateError;
  return true;
}

export async function calculateConservativeBudget(
  supabase: SupabaseClient,
  periodId: string
) {
  // Calculate budget based only on confirmed income
  const { data: incomes, error } = await supabase
    .from("period_income")
    .select("amount")
    .eq("period_id", periodId)
    .eq("is_confirmed", true);
  if (error) throw error;
  const total = (incomes ?? []).reduce((sum, i) => sum + (i.amount ?? 0), 0);
  return total;
}
