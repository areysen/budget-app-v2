import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EnvelopeBalances } from "@/components/dashboard/envelope-balances";
import { AddTransactionForm } from "@/components/transactions/add-transaction-form";
import PeriodHeader, {
  PeriodHeaderData,
} from "@/components/periods/period-header";
import { getActivePeriod, createNewPeriod } from "@/lib/periods";
import { calculateConservativeBudget } from "@/lib/period-income";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const { data: household, error: householdError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  if (!household?.household_id) redirect("/onboarding");

  const householdId = household.household_id;

  // Fetch the session to pass to the client
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // --- Period Data Fetching ---
  let periodHeaderData: PeriodHeaderData | null = null;
  let periodError: string | null = null;
  let period: any = null;
  try {
    period = await getActivePeriod(supabase, householdId);
    if (!period) {
      periodError = null; // No error, just no period
    } else {
      // Fetch income data
      const { data: incomes, error: incomeError } = await supabase
        .from("period_income")
        .select("amount, is_confirmed")
        .eq("period_id", period.id);
      if (incomeError) throw incomeError;
      const confirmed = (incomes ?? [])
        .filter((i) => i.is_confirmed)
        .reduce((sum, i) => sum + (i.amount ?? 0), 0);
      const expected = (incomes ?? [])
        .filter((i) => !i.is_confirmed)
        .reduce((sum, i) => sum + (i.amount ?? 0), 0);
      const total = confirmed + expected;
      // Fetch budget data
      const { data: envelopes, error: envError } = await supabase
        .from("period_envelopes")
        .select("allocated_amount, spent_amount")
        .eq("period_id", period.id);
      if (envError) throw envError;
      const allocated = (envelopes ?? []).reduce(
        (sum, e) => sum + (e.allocated_amount ?? 0),
        0
      );
      const spent = (envelopes ?? []).reduce(
        (sum, e) => sum + (e.spent_amount ?? 0),
        0
      );
      const remaining = allocated - spent;
      periodHeaderData = {
        period: {
          start: new Date(period.start_date),
          end: new Date(period.end_date),
          status: period.status,
        },
        income: { confirmed, expected, total },
        budget: { allocated, spent, remaining },
      };
    }
  } catch (err: any) {
    periodError = err?.message || "Failed to load period data.";
  }

  // Server action for creating the first period
  async function createFirstPeriod(formData: FormData) {
    "use server";
    const { createServerSupabaseClient } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await createServerSupabaseClient();
    const householdId = formData.get("householdId") as string;
    await createNewPeriod(supabase, householdId);
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-bold">Dashboard</h1>
      {/* Period Header Integration or Empty State */}
      {!period && !periodError ? (
        <form
          action={createFirstPeriod}
          className="bg-background-soft border border-border rounded-lg p-6 flex flex-col items-center gap-4"
        >
          <input type="hidden" name="householdId" value={householdId} />
          <div className="text-lg font-semibold text-center">
            No periods found. Get started by creating your first budget period!
          </div>
          <button
            type="submit"
            className="bg-primary text-white rounded-md px-6 py-3 font-medium shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            Create First Period
          </button>
        </form>
      ) : periodError ? (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-error">
          {periodError}
        </div>
      ) : !periodHeaderData ? (
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      ) : (
        <PeriodHeader data={periodHeaderData} />
      )}
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
