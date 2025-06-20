"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Shield,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface SavingsGoalSummaryCardProps {
  goal: {
    id: string;
    name: string;
    description?: string;
    target_amount: number;
    target_date?: string;
    current_balance: number;
    is_emergency_fund: boolean;
    is_roundup_target: boolean;
    sort_order: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function SavingsGoalSummaryCard({
  goal,
  onEdit,
  onDelete,
}: SavingsGoalSummaryCardProps) {
  // Calculate progress
  const currentAmount = goal.current_balance || 0;
  const progressPercentage =
    goal.target_amount > 0
      ? Math.min((currentAmount / goal.target_amount) * 100, 100)
      : 0;

  // Calculate remaining amount
  const remainingAmount = Math.max(goal.target_amount - currentAmount, 0);

  // Format target date if available
  const targetDate = goal.target_date
    ? new Date(goal.target_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${
                goal.is_emergency_fund
                  ? "bg-orange-100 text-orange-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {goal.is_emergency_fund ? (
                <Shield className="h-4 w-4" />
              ) : (
                <Target className="h-4 w-4" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{goal.name}</h3>
                {goal.is_emergency_fund && (
                  <Badge variant="secondary" className="text-xs">
                    Emergency Fund
                  </Badge>
                )}
                {goal.is_roundup_target && (
                  <Badge variant="outline" className="text-xs">
                    Roundup Target
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Target: {formatCurrency(goal.target_amount)}
                {targetDate && (
                  <span className="ml-2">• Due: {targetDate}</span>
                )}
              </p>
              {goal.description && (
                <p className="text-xs text-muted-foreground">
                  {goal.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {formatCurrency(currentAmount)} /{" "}
              {formatCurrency(goal.target_amount)}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progressPercentage.toFixed(1)}% complete</span>
            {remainingAmount > 0 && (
              <span>{formatCurrency(remainingAmount)} remaining</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Remaining
            </div>
            <p className="text-sm font-medium">
              {formatCurrency(remainingAmount)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Target Date
            </div>
            <p className="text-sm font-medium">{targetDate || "No deadline"}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
