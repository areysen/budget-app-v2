"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatFrequencyDisplay } from "@/lib/utils/frequency-helpers";
import { FixedExpense } from "../budget-setup-context";

interface ExpenseSourceSummaryCardProps {
  expense: FixedExpense;
  onEdit: () => void;
  onDelete: () => void;
}

export function ExpenseSourceSummaryCard({
  expense,
  onEdit,
  onDelete,
}: ExpenseSourceSummaryCardProps) {
  const frequencyDisplay =
    expense.frequency_type && expense.frequency_config
      ? formatFrequencyDisplay(expense.frequency_type, expense.frequency_config)
      : "No frequency set";

  const nextDueDate = expense.next_due_date
    ? new Date(expense.next_due_date).toLocaleDateString()
    : null;

  return (
    <Card className="p-4 border-l-4 border-l-warning bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-warning flex-shrink-0" />
            <h4 className="font-semibold text-gray-900 truncate">
              {expense.name}
            </h4>
            {expense.isVariable && (
              <Badge variant="secondary" className="text-xs">
                Variable
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-lg font-mono font-bold text-foreground">
              {formatCurrency(expense.amount)}
            </p>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p>{expense.category}</p>
              <p>{frequencyDisplay}</p>
              {nextDueDate && (
                <p className="text-xs text-muted-foreground">
                  Next due: {nextDueDate}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit {expense.name}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete {expense.name}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
