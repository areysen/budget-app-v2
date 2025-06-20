import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { SavingsGoal } from "../budget-setup-context";

interface SavingsGoalSummaryCardProps {
  goal: SavingsGoal;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
}

export function SavingsGoalSummaryCard({
  goal,
  onEdit,
  onDelete,
}: SavingsGoalSummaryCardProps) {
  // Calculate progress percentage
  const progressPercentage =
    goal.targetAmount > 0
      ? Math.min(
          Math.round((goal.currentAmount / goal.targetAmount) * 100),
          100
        )
      : 0;

  // Format target date if present
  const formattedDate = goal.targetDate
    ? new Date(goal.targetDate).toLocaleDateString()
    : null;

  return (
    <Card className="p-4 mb-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {goal.isEmergencyFund && (
              <ShieldCheck className="h-5 w-5 text-primary" />
            )}
            <h3 className="font-medium">{goal.name}</h3>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(goal)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(goal.id)}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>
              Progress: {formatCurrency(goal.currentAmount)} of{" "}
              {formatCurrency(goal.targetAmount)}
            </span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {formattedDate && (
          <p className="text-xs text-muted-foreground">
            Target date: {formattedDate}
          </p>
        )}

        {goal.isEmergencyFund && (
          <p className="text-xs text-primary">Emergency Fund</p>
        )}
      </div>
    </Card>
  );
}
