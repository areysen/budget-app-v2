import {
  getCurrentPaycheckPeriod,
  getEnvelopeBalances,
  getUserHouseholdId,
} from "@/lib/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { EnvelopeBalanceWithMeta } from "@/lib/database";
import { useMemo } from "react";

// Envelope color utility
const envelopeColors = [
  { bg: "bg-purple-500", border: "border-purple-500", light: "bg-purple-50" },
  { bg: "bg-cyan-500", border: "border-cyan-500", light: "bg-cyan-50" },
  { bg: "bg-green-500", border: "border-green-500", light: "bg-green-50" },
  { bg: "bg-amber-500", border: "border-amber-500", light: "bg-amber-50" },
  { bg: "bg-red-500", border: "border-red-500", light: "bg-red-50" },
  { bg: "bg-blue-500", border: "border-blue-500", light: "bg-blue-50" },
];
const getEnvelopeColor = (index: number) =>
  envelopeColors[index % envelopeColors.length];

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

  // Get envelope balances (with meta)
  const balances: EnvelopeBalanceWithMeta[] = await getEnvelopeBalances(
    currentPeriod.id
  );

  if (!balances || balances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Envelope Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No envelopes found for this period
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by sort_order, then name
  const sorted = balances.slice().sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      if (a.sort_order === null) return 1;
      if (b.sort_order === null) return -1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envelope Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sorted.map((balance, i) => {
            const color = getEnvelopeColor(i);
            const spent = balance.spent_amount;
            const allocated = balance.allocated_amount;
            const progress =
              allocated === 0 ? 0 : Math.min((spent / allocated) * 100, 100);
            const isOverspent = spent > allocated;
            const remaining = Math.max(allocated - spent, 0);
            const overspent = Math.max(spent - allocated, 0);
            return (
              <div
                key={balance.id}
                className={`bg-white rounded-lg p-4 border-l-4 ${color.border} shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-3 h-3 ${color.bg} rounded-full flex-shrink-0`}
                    ></div>
                    <span className="font-medium text-foreground truncate text-sm md:text-base">
                      {balance.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold text-foreground text-base md:text-lg">
                      {formatCurrency(spent)}
                      <span className="text-xs font-normal text-muted-foreground">
                        {" "}
                        / {formatCurrency(allocated)}
                      </span>
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {isOverspent ? (
                        <span className="text-error">
                          Over by {formatCurrency(overspent)}
                        </span>
                      ) : (
                        <>{formatCurrency(remaining)} remaining</>
                      )}
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color.bg} rounded-full transition-all duration-300`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
