// components/periods/period-header.tsx
import React from "react";
import { PeriodStatusBadge } from "./period-status-badge";
import { PeriodBudgetSummary } from "./period-budget-summary";

export interface PeriodHeaderData {
  period: {
    start: Date;
    end: Date;
    status: "draft" | "active" | "completed";
  };
  income: {
    confirmed: number;
    expected: number;
    total: number;
  };
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
  };
}

interface PeriodHeaderProps {
  data: PeriodHeaderData;
  onPrev?: () => void;
  onNext?: () => void;
}

function formatPeriodRange(period: { start: Date; end: Date }) {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return `${period.start.toLocaleDateString(
    undefined,
    opts
  )} - ${period.end.toLocaleDateString(undefined, opts)}`;
}

export default function PeriodHeader({
  data,
  onPrev,
  onNext,
}: PeriodHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm border">
      {/* Left: Period Dates & Status */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          className="text-muted-foreground hover:text-primary p-1"
          aria-label="Previous period"
          onClick={onPrev}
        >
          &lt;
        </button>
        <div className="min-w-0">
          <div className="text-2xl font-bold truncate">
            {formatPeriodRange(data.period)}
          </div>
          <div className="mt-1">
            <PeriodStatusBadge status={data.period.status} />
          </div>
        </div>
        <button
          className="text-muted-foreground hover:text-primary p-1"
          aria-label="Next period"
          onClick={onNext}
        >
          &gt;
        </button>
      </div>
      {/* Center: Income Summary */}
      <div className="flex-1 min-w-0">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium text-green-700">Confirmed Income</span>
            <span className="font-semibold text-green-700">
              ${data.income.confirmed.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Expected Income</span>
            <span className="italic">
              ${data.income.expected.toLocaleString()}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total (if received)</span>
            <span>${data.income.total.toLocaleString()}</span>
          </div>
        </div>
      </div>
      {/* Right: Budget Summary */}
      <div className="min-w-[200px]">
        <PeriodBudgetSummary
          allocated={data.budget.allocated}
          spent={data.budget.spent}
          remaining={data.budget.remaining}
        />
      </div>
    </div>
  );
}
