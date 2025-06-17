import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EnvelopeBalances } from "@/components/dashboard/envelope-balances";
import { AddTransactionForm } from "@/components/transactions/add-transaction-form";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log("Dashboard auth check:", { user, error });

  if (error || !user) redirect("/login");

  const { data: household, error: householdError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  console.log("Household membership check:", { household, householdError });

  if (!household?.household_id) redirect("/onboarding");

  const householdId = household.household_id;

  // Fetch the session to pass to the client
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Envelope Balances */}
        <div>
          <EnvelopeBalances />
        </div>

        {/* Add Transaction Form */}
        <div>
          <AddTransactionForm
            userId={user.id}
            householdId={householdId}
            session={session}
          />
        </div>
      </div>
    </div>
  );
}
