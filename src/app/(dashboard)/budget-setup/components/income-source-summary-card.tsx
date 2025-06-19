"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatFrequencyDisplay } from "@/lib/utils/frequency-helpers";
import { IncomeSource } from "../budget-setup-context";

interface IncomeSourceSummaryCardProps {
  income: IncomeSource;
  onEdit: () => void;
  onDelete?: () => void;
}

export function IncomeSourceSummaryCard({
  income,
  onEdit,
  onDelete,
}: IncomeSourceSummaryCardProps) {
  const frequencyDisplay =
    income.frequency_type && income.frequency_config
      ? formatFrequencyDisplay(income.frequency_type, income.frequency_config)
      : "No frequency set";

  return (
    <Card className="p-4 border-l-4 border-l-primary bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
            <h4 className="font-semibold text-gray-900 truncate">
              {income.name}
            </h4>
            {income.is_primary && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Primary
              </span>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-lg font-mono font-bold text-success">
              {formatCurrency(income.amount)}
            </p>
            <p className="text-sm text-gray-600">{frequencyDisplay}</p>
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
            <span className="sr-only">Edit {income.name}</span>
          </Button>

          {!income.is_primary && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete {income.name}</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
