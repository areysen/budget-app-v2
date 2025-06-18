import { subDays, addDays, endOfMonth } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PaycheckDate {
  date: Date;
  isEndOfMonth: boolean;
}

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

export function getCurrentPeriod(date = new Date()): {
  start: Date;
  end: Date;
} {
  const month = date.getMonth();
  const year = date.getFullYear();

  // Always return the 1st-14th period of the current month
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month, 14),
  };
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
  // Try to get the current active period
  let { data: period, error } = await supabase
    .from("paycheck_periods")
    .select("*")
    .eq("household_id", householdId)
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (period) return period;

  // If no active period, get the most recent draft
  const { data: draft, error: draftError } = await supabase
    .from("paycheck_periods")
    .select("*")
    .eq("household_id", householdId)
    .eq("status", "draft")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (draftError) throw draftError;
  return draft;
}

export async function createNewPeriod(
  supabase: SupabaseClient,
  householdId: string,
  paycheckDate?: Date // Optional: for early paycheck handling
) {
  // Use provided paycheckDate or calculate next scheduled
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  let scheduledDate: Date;
  if (paycheckDate) {
    scheduledDate = paycheckDate;
  } else {
    // Default: next 15th or EOM
    const fifteenth = new Date(year, month, 15);
    const endOfMonth = new Date(year, month + 1, 0);
    scheduledDate = today.getDate() < 15 ? fifteenth : endOfMonth;
  }
  const actualPaycheck = calculateActualPaycheckDate(scheduledDate);
  // Calculate period range
  let periodStart: Date, periodEnd: Date;
  if (actualPaycheck.getDate() === 15) {
    periodStart = new Date(year, month, 1);
    periodEnd = new Date(year, month, 14);
  } else {
    periodStart = new Date(year, month, 15);
    periodEnd = new Date(year, month + 1, 0);
  }
  // Insert new period
  const { data, error } = await supabase
    .from("paycheck_periods")
    .insert({
      household_id: householdId,
      start_date: periodStart.toISOString().slice(0, 10),
      end_date: periodEnd.toISOString().slice(0, 10),
      status: "draft",
      total_income: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
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

export function getPaycheckRange(
  currentPaycheck: PaycheckDate,
  nextPaycheck?: PaycheckDate
): { start: Date; end: Date } {
  const start = new Date(currentPaycheck.date);

  if (currentPaycheck.isEndOfMonth) {
    return {
      start,
      end: endOfMonth(start),
    };
  }

  if (start.getDate() === 1) {
    return {
      start,
      end: subDays(addDays(start, 14), 1), // 1st-14th
    };
  }

  if (start.getDate() === 15) {
    return {
      start,
      end: endOfMonth(start), // 15th-EOM
    };
  }

  throw new Error("Invalid paycheck date");
}
