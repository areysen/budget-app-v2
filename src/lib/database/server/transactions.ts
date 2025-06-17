import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Database } from "@/types/supabase";

export async function addTransaction(data: {
  amount: number;
  description: string;
  envelope_id: string;
  transaction_date: string;
  notes?: string;
  household_id: string;
  entered_by: string;
}) {
  const supabase = createServerSupabaseClient();

  const { data: transaction, error } = await supabase
    .from("user_transactions")
    .insert({
      ...data,
      approval_status: "approved", // Direct approval for manual entry
      approved_at: new Date().toISOString(),
      approved_by: data.entered_by,
    })
    .select()
    .single();

  if (error) throw error;
  return transaction;
}

export async function getActiveEnvelopes(household_id: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("envelopes")
    .select("id, name, sort_order")
    .eq("household_id", household_id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}
