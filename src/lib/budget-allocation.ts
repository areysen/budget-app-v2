// lib/budget-allocation.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export async function initializePeriodBudget(
  supabase: SupabaseClient,
  periodId: string,
  householdId: string
) {
  // 1. Copy active envelopes to period_envelopes with default_amount
  const { data: envelopes, error: envelopeError } = await supabase
    .from("envelopes")
    .select("id, default_amount")
    .eq("household_id", householdId)
    .eq("is_active", true);
  if (envelopeError) throw envelopeError;
  if (envelopes && envelopes.length > 0) {
    const periodEnvelopes = envelopes.map((env) => ({
      period_id: periodId,
      envelope_id: env.id,
      allocated_amount: env.default_amount ?? 0,
      spent_amount: 0,
    }));
    const { error: periodEnvError } = await supabase
      .from("period_envelopes")
      .insert(periodEnvelopes);
    if (periodEnvError) throw periodEnvError;
  }

  // 2. Copy active fixed_expenses to period_fixed_expenses
  const { data: fixedExpenses, error: fixedError } = await supabase
    .from("fixed_expenses")
    .select("id, estimated_amount, due_day")
    .eq("household_id", householdId)
    .eq("is_active", true);
  if (fixedError) throw fixedError;
  if (fixedExpenses && fixedExpenses.length > 0) {
    const periodFixedExpenses = fixedExpenses.map((fx) => ({
      period_id: periodId,
      fixed_expense_id: fx.id,
      allocated_amount: fx.estimated_amount ?? 0,
      due_date: fx.due_day ? getDueDateForPeriod(fx.due_day) : null,
      is_paid: false,
    }));
    const { error: periodFxError } = await supabase
      .from("period_fixed_expenses")
      .insert(periodFixedExpenses);
    if (periodFxError) throw periodFxError;
  }

  // 3. TODO: Handle rollover amounts from previous period
  // 4. TODO: Calculate due dates for fixed expenses in this period (improved logic)
}

function getDueDateForPeriod(dueDay: number): string | null {
  // For now, just return the next dueDay in the current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const dueDate = new Date(year, month, dueDay);
  return dueDate.toISOString().slice(0, 10);
}

export async function handleEnvelopeRollovers(
  supabase: SupabaseClient,
  fromPeriodId: string,
  toPeriodId: string
) {
  // Apply rollover rules: 'save', 'rollover', 'rollover_limit'
  // Move excess to savings goals as configured
}
