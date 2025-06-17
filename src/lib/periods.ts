import { subDays } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

// --- Phase 1: Period Date Logic WITH Weekend/Holiday Handling ---

export function calculateActualPaycheckDate(scheduledDate: Date): Date {
  // Handle weekend and holiday adjustments
  // If 15th or EOM falls on weekend/holiday, paycheck comes on previous business day
  const day = scheduledDate.getDay();
  // If Saturday (6), move to Friday
  if (day === 6) {
    return subDays(scheduledDate, 1);
  }
  // If Sunday (0), move to Friday
  if (day === 0) {
    return subDays(scheduledDate, 2);
  }
  // TODO: Add holiday checking logic here
  // Check if date is a federal holiday and adjust accordingly
  return scheduledDate;
}

export function calculateSemiMonthlyPeriods(year: number) {
  // Generate all semi-monthly periods for a year
  // BUT use ACTUAL paycheck dates, not scheduled dates
  const periods = [];
  for (let month = 0; month < 12; month++) {
    // 15th period (1st-14th, paid on 15th)
    const fifteenth = new Date(year, month, 15);
    const actualFifteenth = calculateActualPaycheckDate(fifteenth);
    // EOM period (15th-EOM, paid on last day of month)
    const endOfMonth = new Date(year, month + 1, 0); // Last day of month
    const actualEOM = calculateActualPaycheckDate(endOfMonth);
    periods.push({
      scheduled: fifteenth,
      actual: actualFifteenth,
      period: {
        start: new Date(year, month, 1),
        end: new Date(year, month, 14),
      },
    });
    periods.push({
      scheduled: endOfMonth,
      actual: actualEOM,
      period: { start: new Date(year, month, 15), end: endOfMonth },
    });
  }
  return periods;
}

export function getCurrentPeriod(date = new Date()) {
  // Determine which period a given date falls into
  // Use ACTUAL paycheck dates to determine period boundaries
}

export function handleEarlyPaycheck(expectedDate: Date, actualDate: Date) {
  // Manual override logic for when paycheck comes early
  // User can choose to start next period immediately or wait
  return {
    canAdvancePeriod: true,
    recommendation: "Start next period now since paycheck arrived early",
  };
}

// --- Phase 2: Period Management Database Functions WITH Business Rules ---

export async function getActivePeriod(
  supabase: SupabaseClient,
  householdId: string
) {
  // Get the current active period or most recent draft
  // Account for early paycheck scenarios
}

export async function createNewPeriod(
  supabase: SupabaseClient,
  householdId: string,
  paycheckDate?: Date // Optional: for early paycheck handling
) {
  // Create new period with proper date ranges
  // Use ACTUAL paycheck date if provided (early paycheck scenario)
  // Copy envelope defaults to period_envelopes
  // Copy fixed expenses to period_fixed_expenses
  // Set status to 'draft'
  // Business rule: Conservative budgeting
  // Don't count Jordan's mom's income until it actually arrives
}

export async function handleJordansMomIncome(
  supabase: SupabaseClient,
  periodId: string,
  expectedDate: Date
) {
  // Jordan's mom pays $400 every 2 weeks
  // Add as "expected but unconfirmed" income
  // Only count toward budget once received
  return await addIncomeToPeriod(supabase, periodId, {
    source_name: "Jordan's Mom",
    amount: 400,
    expected_date: expectedDate.toISOString(),
    is_confirmed: false, // KEY: Don't budget against this until confirmed
  });
}

export async function approvePeriod(
  supabase: SupabaseClient,
  periodId: string,
  userId: string
) {
  // Change status from 'draft' to 'active'
  // Complete previous period if needed
  // Trigger rollover logic from previous period
}

// --- Helper stub for addIncomeToPeriod (to be implemented in period-income.ts) ---
async function addIncomeToPeriod(
  supabase: SupabaseClient,
  periodId: string,
  income: {
    source_name: string;
    amount: number;
    expected_date: string;
    is_confirmed: boolean;
  }
) {
  // Stub for cross-file reference
}
