import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";

interface EnvelopeSummaryCardProps {
  envelope: {
    id: string;
    name: string;
    default_amount: number;
    rollover_rule: "always_rollover" | "rollover_limit" | "always_to_savings";
    rollover_limit?: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function EnvelopeSummaryCard({
  envelope,
  onEdit,
  onDelete,
}: EnvelopeSummaryCardProps) {
  // Format rollover rule for display
  const getRolloverText = () => {
    switch (envelope.rollover_rule) {
      case "always_rollover":
        return "Always rolls over";
      case "rollover_limit":
        return `Rolls over up to ${formatCurrency(
          envelope.rollover_limit || 0
        )}`;
      case "always_to_savings":
        return "Excess goes to savings";
      default:
        return "";
    }
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">{envelope.name}</h3>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(envelope.default_amount)} per period
          </p>
          <p className="text-xs text-muted-foreground">{getRolloverText()}</p>
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
    </Card>
  );
}
