import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const getRolloverText = () => {
    switch (envelope.rolloverRule) {
      case "rollover":
        return "Always rolls over";
      case "rollover_limit":
        return `Rolls over up to ${formatCurrency(
          envelope.rolloverLimit || 0
        )}`;
      case "save":
        return "Excess goes to savings";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <p className="font-semibold">{envelope.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(envelope.amount)} per period
          </p>
          <p className="text-xs text-muted-foreground">{getRolloverText()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-600"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
