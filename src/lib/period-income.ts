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
  // Add income source to period
  // Update period.total_income
}

export async function calculateConservativeBudget(
  supabase: SupabaseClient,
  periodId: string
) {
  // Calculate budget based only on confirmed income
  // Used for envelope allocation decisions
}
