import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();

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
  const supabase = createClient();

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

// Helper function to get envelope color based on index
export function getEnvelopeColor(index: number) {
  const colors = [
    { bg: "bg-purple-500", text: "text-purple-500" },
    { bg: "bg-cyan-500", text: "text-cyan-500" },
    { bg: "bg-green-500", text: "text-green-500" },
    { bg: "bg-amber-500", text: "text-amber-500" },
    { bg: "bg-red-500", text: "text-red-500" },
    { bg: "bg-blue-500", text: "text-blue-500" },
  ];

  return colors[index % colors.length];
}
