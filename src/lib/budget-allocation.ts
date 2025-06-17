// lib/budget-allocation.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export async function initializePeriodBudget(
  supabase: SupabaseClient,
  periodId: string,
  householdId: string
) {
  // 1. Copy active envelopes to period_envelopes with default_amount
  // 2. Copy active fixed_expenses to period_fixed_expenses
  // 3. Handle rollover amounts from previous period
  // 4. Calculate due dates for fixed expenses in this period
}

export async function handleEnvelopeRollovers(
  supabase: SupabaseClient,
  fromPeriodId: string,
  toPeriodId: string
) {
  // Apply rollover rules: 'save', 'rollover', 'rollover_limit'
  // Move excess to savings goals as configured
}
