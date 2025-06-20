import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { Envelope } from "../budget-setup-context";
import { Edit, Trash2, Box } from "lucide-react";

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
    <Card className="p-4 border-l-4 border-l-primary bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Box className="h-4 w-4 text-primary flex-shrink-0" />
            <h4 className="font-semibold text-gray-900 truncate">
              {envelope.name}
            </h4>
          </div>

          <div className="space-y-1 pl-6">
            <p className="text-lg font-mono font-bold text-foreground">
              {formatCurrency(envelope.amount)}
            </p>
            <p className="text-sm text-gray-600">{getRolloverText()}</p>
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
            <span className="sr-only">Edit {envelope.name}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete {envelope.name}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
