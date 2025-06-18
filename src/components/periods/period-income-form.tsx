import React from "react";

interface PeriodIncomeFormProps {
  incomes: Array<{
    id?: string;
    source_name: string;
    amount: number;
    expected_date: string;
    is_confirmed: boolean;
  }>;
  onAdd: (income: {
    source_name: string;
    amount: number;
    expected_date: string;
    is_confirmed: boolean;
  }) => void;
  onConfirm: (incomeId: string) => void;
}

export function PeriodIncomeForm({
  incomes,
  onAdd,
  onConfirm,
}: PeriodIncomeFormProps) {
  // For brevity, this is a stub UI. Real implementation would use form state, validation, etc.
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Income Sources</h3>
      <ul className="space-y-2">
        {incomes.map((income) => (
          <li
            key={income.id || income.source_name}
            className="flex items-center justify-between"
          >
            <div>
              <span
                className={
                  income.is_confirmed
                    ? "text-green-700 font-medium"
                    : "text-muted-foreground italic"
                }
              >
                {income.source_name}
              </span>
              <span className="ml-2">${income.amount.toLocaleString()}</span>
              {!income.is_confirmed && (
                <span className="ml-2 text-xs text-yellow-600">(Expected)</span>
              )}
            </div>
            {!income.is_confirmed && (
              <button
                className="text-xs text-green-700 underline ml-2"
                onClick={() => income.id && onConfirm(income.id)}
              >
                Mark as Received
              </button>
            )}
            {income.is_confirmed && (
              <span className="ml-2 text-green-600">✔</span>
            )}
          </li>
        ))}
      </ul>
      {/* Add income form (stub) */}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: Implement add logic
        }}
      >
        <input className="border rounded px-2 py-1" placeholder="Source name" />
        <input
          className="border rounded px-2 py-1"
          placeholder="Amount"
          type="number"
        />
        <input
          className="border rounded px-2 py-1"
          placeholder="Date"
          type="date"
        />
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" /> Confirmed
        </label>
        <button
          className="bg-primary text-white px-3 py-1 rounded text-xs"
          type="submit"
        >
          Add
        </button>
      </form>
    </div>
  );
}
