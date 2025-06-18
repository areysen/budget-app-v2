import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Checks if the household has completed the minimum budget setup.
 * Returns true if all required tables have at least one record for the household.
 * Returns false if any are missing or on error.
 */
export async function checkBudgetSetupComplete(
  householdId: string
): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  try {
    // Check income_sources (updated from period_income)
    const { count: incomeCount, error: incomeError } = await supabase
      .from("income_sources")
      .select("*", { count: "exact", head: true })
      .eq("household_id", householdId);
    if (incomeError) {
      console.error("Error checking income_sources:", incomeError);
      return false;
    }
    // Check fixed_expenses
    const { count: expenseCount, error: expenseError } = await supabase
      .from("fixed_expenses")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId);
    if (expenseError) {
      console.error("Error checking fixed_expenses:", expenseError);
      return false;
    }
    // Check envelopes
    const { count: envelopeCount, error: envelopeError } = await supabase
      .from("envelopes")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId);
    if (envelopeError) {
      console.error("Error checking envelopes:", envelopeError);
      return false;
    }
    // Check savings_goals
    const { count: goalCount, error: goalError } = await supabase
      .from("savings_goals")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId);
    if (goalError) {
      console.error("Error checking savings_goals:", goalError);
      return false;
    }
    // Debug logging
    console.debug("Budget setup check:", {
      incomeCount,
      expenseCount,
      envelopeCount,
      goalCount,
    });
    return (
      (incomeCount ?? 0) > 0 &&
      (expenseCount ?? 0) > 0 &&
      (envelopeCount ?? 0) > 0 &&
      (goalCount ?? 0) > 0
    );
  } catch (err) {
    console.error("Error in checkBudgetSetupComplete:", err);
    return false;
  }
}
