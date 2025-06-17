import { EnvelopeBalances } from "@/components/dashboard/envelope-balances";
import { HouseholdSetup } from "@/components/dashboard/household-setup";
import { getUserHouseholdId } from "@/lib/database";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Not Authenticated</h1>
        <p className="text-muted-foreground">
          Please sign in to access the dashboard.
        </p>
      </div>
    );
  }

  // Check if user has a household
  const householdId = await getUserHouseholdId(user.id);
  if (!householdId) {
    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Welcome to Budget App</h1>
        <HouseholdSetup />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <EnvelopeBalances />
    </div>
  );
}
