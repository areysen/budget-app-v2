import React from "react";

interface PeriodBudgetSummaryProps {
  allocated: number;
  spent: number;
  remaining: number;
}

export function PeriodBudgetSummary({
  allocated,
  spent,
  remaining,
}: PeriodBudgetSummaryProps) {
  const progress =
    allocated === 0 ? 0 : Math.min((spent / allocated) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>Allocated</span>
        <span>${allocated.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Spent: ${spent.toLocaleString()}</span>
        <span>Remaining: ${remaining.toLocaleString()}</span>
      </div>
    </div>
  );
}
