import {
  getCurrentPaycheckPeriod,
  getEnvelopeBalances,
  getUserHouseholdId,
} from "@/lib/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function EnvelopeBalances() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not Authenticated</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please sign in to view your envelope balances.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get household ID
  const householdId = await getUserHouseholdId(user.id);
  if (!householdId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Household</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You are not a member of any household.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get current period
  const currentPeriod = await getCurrentPaycheckPeriod(householdId);
  if (!currentPeriod) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Period</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            There is no active paycheck period.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get envelope balances
  const balances = await getEnvelopeBalances(currentPeriod.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envelope Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {balances.map((balance) => (
            <div
              key={balance.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div>
                <h3 className="font-medium">{balance.envelope_id}</h3>
                <p className="text-sm text-muted-foreground">
                  Allocated: {formatCurrency(balance.allocated_amount)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  Spent: {formatCurrency(balance.spent_amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Remaining:{" "}
                  {formatCurrency(
                    balance.allocated_amount - balance.spent_amount
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
