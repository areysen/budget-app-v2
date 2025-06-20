import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface SavingsGoalSummaryCardProps {
  goal: {
    id: string;
    name: string;
    target_amount: number;
    current_balance: number;
    target_date?: string;
    is_emergency_fund: boolean;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function SavingsGoalSummaryCard({
  goal,
  onEdit,
  onDelete,
}: SavingsGoalSummaryCardProps) {
  // Calculate progress percentage
  const progressPercentage =
    goal.target_amount > 0
      ? Math.min(
          Math.round((goal.current_balance / goal.target_amount) * 100),
          100
        )
      : 0;

  // Format target date if present
  const formattedDate = goal.target_date
    ? new Date(goal.target_date).toLocaleDateString()
    : null;

  return (
    <Card className="p-4 mb-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {goal.is_emergency_fund && (
              <ShieldCheck className="h-5 w-5 text-primary" />
            )}
            <h3 className="font-medium">{goal.name}</h3>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>
              Progress: {formatCurrency(goal.current_balance)} of{" "}
              {formatCurrency(goal.target_amount)}
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

        {goal.is_emergency_fund && (
          <p className="text-xs text-primary">Emergency Fund</p>
        )}
      </div>
    </Card>
  );
}
