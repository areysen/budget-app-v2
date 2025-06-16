import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Household = Database["public"]["Tables"]["households"]["Row"];
type PaycheckPeriod = Database["public"]["Tables"]["paycheck_periods"]["Row"];
type Envelope = Database["public"]["Tables"]["envelopes"]["Row"];
type EnvelopeBalance = Database["public"]["Tables"]["period_envelopes"]["Row"];
type Transaction = Database["public"]["Tables"]["user_transactions"]["Row"];

// User & Household Management
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("getUserProfile error:", error);
    return null;
  }
}

export async function getUserHousehold(
  userId: string
): Promise<Household | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("household_members")
      .select("households(*)")
      .eq("user_id", userId)
      .single();
    if (error) throw error;
    return data?.households ?? null;
  } catch (error) {
    console.error("getUserHousehold error:", error);
    return null;
  }
}

export async function createUserHousehold(userId: string, name: string) {
  console.log("createUserHousehold called with:", { userId, name });
  const supabase = createServerSupabaseClient();

  // 1. Create the household with created_by set to userId
  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert({ name, created_by: userId })
    .select()
    .maybeSingle();

  if (householdError || !household) {
    console.error("Household insert error:", householdError, "userId:", userId);
    throw new Error(
      "Failed to create household: " +
        (householdError?.message ?? "Unknown error")
    );
  }

  // No need to insert into household_members; handled by DB trigger
  return household;
}

// Paycheck Period Management
export async function getCurrentPaycheckPeriod(
  householdId: string
): Promise<PaycheckPeriod | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("paycheck_periods")
      .select("*")
      .eq("household_id", householdId)
      .lte("start_date", new Date().toISOString())
      .gte("end_date", new Date().toISOString())
      .order("start_date", { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("getCurrentPaycheckPeriod error:", error);
    return null;
  }
}

export async function createPaycheckPeriod(
  householdId: string,
  startDate: Date,
  endDate: Date,
  expectedIncome: number
): Promise<PaycheckPeriod | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("paycheck_periods")
      .insert({
        household_id: householdId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        expected_income: expectedIncome,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("createPaycheckPeriod error:", error);
    return null;
  }
}

// Envelope System
export async function getEnvelopeBalances(
  periodId: string
): Promise<EnvelopeBalance[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("period_envelopes")
      .select("*")
      .eq("period_id", periodId);
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("getEnvelopeBalances error:", error);
    return [];
  }
}

export async function getHouseholdEnvelopes(
  householdId: string
): Promise<Envelope[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("envelopes")
      .select("*")
      .eq("household_id", householdId);
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("getHouseholdEnvelopes error:", error);
    return [];
  }
}

// Quick Helpers
export async function getPendingTransactions(
  householdId: string
): Promise<Transaction[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("user_transactions")
      .select("*")
      .eq("household_id", householdId)
      .eq("status", "pending");
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("getPendingTransactions error:", error);
    return [];
  }
}

// Session Helpers
export async function getUserHouseholdId(
  userId: string
): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data?.household_id ?? null;
  } catch (error) {
    console.error("getUserHouseholdId error:", error);
    return null;
  }
}

// Test Data Helpers
export async function createTestData(userId: string): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Create or get household
    let household = await getUserHousehold(userId);
    if (!household) {
      household = await createUserHousehold(userId, "Test Household");
      if (!household) throw new Error("Failed to create household");
    }

    // 2. Create test envelopes
    const envelopes = [
      { name: "Groceries", default_amount: 500, rollover_rule: "rollover" },
      { name: "Dining Out", default_amount: 200, rollover_rule: "save" },
      {
        name: "Entertainment",
        default_amount: 150,
        rollover_rule: "rollover_limit",
        rollover_limit: 300,
      },
      {
        name: "Transportation",
        default_amount: 100,
        rollover_rule: "rollover",
      },
      { name: "Shopping", default_amount: 200, rollover_rule: "save" },
    ];

    const { data: createdEnvelopes, error: envelopeError } = await supabase
      .from("envelopes")
      .insert(
        envelopes.map((env) => ({
          ...env,
          household_id: household.id,
        }))
      )
      .select();
    if (envelopeError) throw envelopeError;

    // 3. Create current paycheck period
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const { data: period, error: periodError } = await supabase
      .from("paycheck_periods")
      .insert({
        household_id: household.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
        total_income: 3000,
      })
      .select()
      .single();
    if (periodError) throw periodError;

    // 4. Create period envelopes with some spent amounts
    const { error: periodEnvelopeError } = await supabase
      .from("period_envelopes")
      .insert(
        createdEnvelopes.map((env) => ({
          period_id: period.id,
          envelope_id: env.id,
          allocated_amount: env.default_amount ?? 0,
          spent_amount: Math.floor(Math.random() * (env.default_amount ?? 0)),
        }))
      );
    if (periodEnvelopeError) throw periodEnvelopeError;

    console.log("Test data created successfully");
  } catch (error) {
    console.error("createTestData error:", error);
    throw error;
  }
}
