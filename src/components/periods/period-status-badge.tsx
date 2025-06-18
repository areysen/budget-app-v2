import { CheckCircle, Edit, Archive } from "lucide-react";
import React from "react";

const statusConfig = {
  draft: { color: "bg-yellow-100 text-yellow-800", label: "Draft", icon: Edit },
  active: {
    color: "bg-green-100 text-green-800",
    label: "Active",
    icon: CheckCircle,
  },
  completed: {
    color: "bg-blue-100 text-blue-800",
    label: "Completed",
    icon: Archive,
  },
};

type PeriodStatus = "draft" | "active" | "completed";

export function PeriodStatusBadge({ status }: { status: PeriodStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${config.color}`}
      aria-label={`Period status: ${config.label}`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      {config.label}
    </span>
  );
}
