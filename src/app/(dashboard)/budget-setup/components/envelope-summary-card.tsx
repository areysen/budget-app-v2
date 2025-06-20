import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { Envelope } from "../budget-setup-context";

interface EnvelopeSummaryCardProps {
  envelope: Envelope;
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
    switch (envelope.rolloverRule) {
      case "always_rollover":
        return "Always rolls over";
      case "rollover_limit":
        return `Rolls over up to ${formatCurrency(
          envelope.rolloverLimit || 0
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
            {formatCurrency(envelope.amount)} per period
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
