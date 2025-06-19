"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  FrequencyType,
  FrequencyConfig,
  MonthlyConfig,
  SemiMonthlyConfig,
} from "@/types/frequency";
import {
  createFrequencyConfig,
  validateFrequencyConfig,
  getFrequencyOptions,
  getDayOptions,
  getOrdinalSuffix,
} from "@/lib/utils/frequency-helpers";
import { IncomeSource } from "../budget-setup-context";
import { toast } from "react-hot-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(0, "Amount must be greater than 0"),
  frequency_type: z.enum([
    "monthly",
    "biweekly",
    "weekly",
    "yearly",
    "quarterly",
    "semi_monthly",
    "per_paycheck",
  ]),
  frequency_config: z.any(),
  anchor_date: z.string().nullable(),
  next_payment_date: z.string().nullable(),
  household_id: z.string(),
});

type FormSchema = z.infer<typeof formSchema>;

interface IncomeSourceFormProps {
  onSubmit: (data: FormSchema) => void;
  existingData?: FormSchema;
  isLoading?: boolean;
  title: string;
  submitLabel: string;
  cancelLabel: string;
  onCancel: () => void;
}

export function IncomeSourceForm({
  onSubmit,
  existingData,
  isLoading = false,
  title,
  submitLabel,
  cancelLabel,
  onCancel,
}: IncomeSourceFormProps) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingData?.name || "",
      amount: existingData?.amount || 0,
      frequency_type: existingData?.frequency_type || "monthly",
      frequency_config:
        existingData?.frequency_config ||
        createFrequencyConfig.monthly(1, false),
      anchor_date: existingData?.anchor_date || null,
      next_payment_date: existingData?.next_payment_date || null,
      household_id: existingData?.household_id || "",
    },
  });

  // Set initial frequency config if not provided
  React.useEffect(() => {
    const currentConfig = form.getValues("frequency_config");
    const currentType = form.getValues("frequency_type");

    if (!currentConfig) {
      handleFrequencyTypeChange(currentType);
    }
  }, []);

  const handleSubmit = form.handleSubmit(async (data: FormSchema) => {
    // Ensure frequency_config is properly typed
    if (!data.frequency_type || !data.frequency_config) {
      return;
    }

    // Validate frequency config before submitting
    if (!validateFrequencyConfig(data.frequency_type, data.frequency_config)) {
      toast.error("Invalid frequency configuration");
      return;
    }

    await onSubmit(data);
  });

  const handleFrequencyTypeChange = (type: string) => {
    form.setValue("frequency_type", type as FrequencyType);

    // Set default config based on type
    switch (type) {
      case "monthly":
        form.setValue(
          "frequency_config",
          createFrequencyConfig.monthly(1, false)
        );
        break;
      case "biweekly":
        form.setValue(
          "frequency_config",
          createFrequencyConfig.biweekly("friday", new Date().toISOString())
        );
        break;
      case "weekly":
        form.setValue(
          "frequency_config",
          createFrequencyConfig.weekly("friday")
        );
        break;
      case "semi_monthly":
        form.setValue(
          "frequency_config",
          createFrequencyConfig.semiMonthly(1, 15, false)
        );
        break;
      case "quarterly":
        form.setValue(
          "frequency_config",
          createFrequencyConfig.quarterly("regular", 1)
        );
        break;
      case "yearly":
        form.setValue("frequency_config", createFrequencyConfig.yearly(1, 1));
        break;
      case "per_paycheck":
        form.setValue("frequency_config", createFrequencyConfig.perPaycheck());
        break;
      default:
        form.setValue("frequency_config", null);
    }
  };

  // Helper for rendering frequency fields
  function renderFrequencyFields(frequencyType: string) {
    function updateConfig(configUpdates: Partial<any>) {
      const currentConfig = form.watch("frequency_config") as FrequencyConfig;
      let newConfig: FrequencyConfig;

      switch (frequencyType) {
        case "monthly":
          if (configUpdates.is_end_of_month) {
            newConfig = createFrequencyConfig.monthly(1, true);
          } else {
            newConfig = createFrequencyConfig.monthly(
              configUpdates.day_of_month ||
                (currentConfig as any).day_of_month ||
                1,
              false
            );
          }
          break;

        case "biweekly":
          newConfig = createFrequencyConfig.biweekly(
            configUpdates.day_of_week ||
              (currentConfig as any).day_of_week ||
              "friday",
            new Date().toISOString()
          );
          break;

        case "weekly":
          newConfig = createFrequencyConfig.weekly(
            configUpdates.day_of_week ||
              (currentConfig as any).day_of_week ||
              "friday"
          );
          break;

        case "semi_monthly":
          newConfig = createFrequencyConfig.semiMonthly(
            configUpdates.first_day || (currentConfig as any).first_day || 1,
            configUpdates.second_is_eom
              ? null
              : configUpdates.second_day ||
                  (currentConfig as any).second_day ||
                  15,
            configUpdates.second_is_eom || false
          );
          break;

        case "yearly":
          newConfig = createFrequencyConfig.yearly(
            configUpdates.month || (currentConfig as any).month || 1,
            configUpdates.day || (currentConfig as any).day || 1
          );
          break;

        case "quarterly":
          if (configUpdates.quarterly_type === "regular") {
            newConfig = createFrequencyConfig.quarterly(
              "regular",
              configUpdates.day_of_month ||
                (currentConfig as any).day_of_month ||
                1
            );
          } else if (configUpdates.quarterly_type === "custom") {
            newConfig = createFrequencyConfig.quarterly(
              "custom",
              undefined,
              (currentConfig as any).custom_dates || Array(4).fill("")
            );
          } else if (configUpdates.custom_dates) {
            // Handle updates to custom dates
            newConfig = createFrequencyConfig.quarterly(
              "custom",
              undefined,
              configUpdates.custom_dates
            );
          } else {
            newConfig = createFrequencyConfig.quarterly(
              (currentConfig as any).quarterly_type || "regular",
              (currentConfig as any).day_of_month || 1
            );
          }
          break;

        default:
          return;
      }

      form.setValue("frequency_config", newConfig);
    }

    if (frequencyType === "monthly") {
      const config = form.watch("frequency_config") as MonthlyConfig;
      if (!config) return null;

      return (
        <div className="space-y-4">
          <div>
            <Label>Monthly Schedule</Label>
            <div className="space-y-4 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="specific-day"
                  checked={!config.is_end_of_month}
                  onChange={() => updateConfig({ is_end_of_month: false })}
                  className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex items-center space-x-2">
                  <label htmlFor="specific-day" className="text-sm font-medium">
                    Specific day
                  </label>
                  <Select
                    value={String(config.day_of_month || 1)}
                    onValueChange={(value) =>
                      updateConfig({ day_of_month: parseInt(value, 10) })
                    }
                    disabled={config.is_end_of_month}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(
                        (day) => (
                          <SelectItem key={day} value={String(day)}>
                            {day}
                            {getOrdinalSuffix(day)}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500">of each month</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="end-of-month"
                  checked={config.is_end_of_month}
                  onChange={() => updateConfig({ is_end_of_month: true })}
                  className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="end-of-month" className="text-sm font-medium">
                  End of month
                </label>
              </div>
              {config.is_end_of_month && (
                <p className="text-sm text-gray-500 mt-1">
                  Last day of each month (Jan 31, Feb 28/29, Mar 31, Apr 30,
                  etc.)
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (frequencyType === "biweekly" || frequencyType === "weekly") {
      const config = form.watch("frequency_config") as any;
      if (!config) return null;

      return (
        <div className="space-y-4">
          <div>
            <Label>
              {frequencyType === "biweekly"
                ? "Every Two Weeks"
                : "Weekly Schedule"}
            </Label>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Day of Week
                </label>
                <Select
                  value={config.day_of_week || "friday"}
                  onValueChange={(value) =>
                    updateConfig({ day_of_week: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ].map((day) => (
                      <SelectItem
                        key={day.toLowerCase()}
                        value={day.toLowerCase()}
                      >
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {frequencyType === "biweekly" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    First Payment Date
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="date"
                      value={form.watch("anchor_date") || ""}
                      onChange={(e) => {
                        const date = e.target.value;
                        form.setValue("anchor_date", date);
                        if (date) {
                          const nextDate = new Date(date);
                          nextDate.setDate(nextDate.getDate() + 14);
                          form.setValue(
                            "next_payment_date",
                            nextDate.toISOString().split("T")[0]
                          );
                        }
                      }}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose the first payment date. Future payments will be every
                    other {config.day_of_week} from this date.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (frequencyType === "semi_monthly") {
      const config = form.watch("frequency_config") as SemiMonthlyConfig;
      if (!config) return null;

      return (
        <div className="space-y-4">
          <div>
            <Label>Twice Monthly Schedule</Label>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  First Payment
                </label>
                <Select
                  value={String(config.first_day)}
                  onValueChange={(value) =>
                    updateConfig({ first_day: parseInt(value, 10) })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        {day}
                        {getOrdinalSuffix(day)} of the month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Second Payment
                </label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="specific-second-day"
                      checked={!config.second_is_eom}
                      onChange={() => updateConfig({ second_is_eom: false })}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex items-center space-x-2">
                      <label
                        htmlFor="specific-second-day"
                        className="text-sm font-medium"
                      >
                        Specific day
                      </label>
                      <Select
                        value={String(config.second_day || 15)}
                        onValueChange={(value) =>
                          updateConfig({ second_day: parseInt(value, 10) })
                        }
                        disabled={config.second_is_eom}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(
                            (day) => (
                              <SelectItem key={day} value={String(day)}>
                                {day}
                                {getOrdinalSuffix(day)}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="second-end-of-month"
                      checked={config.second_is_eom}
                      onChange={() => updateConfig({ second_is_eom: true })}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor="second-end-of-month"
                      className="text-sm font-medium"
                    >
                      End of month
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (frequencyType === "yearly") {
      const config = form.watch("frequency_config") as any;
      if (!config) return null;

      return (
        <div className="space-y-4">
          <div>
            <Label>Yearly Schedule</Label>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-2">Month</label>
                <Select
                  value={String(config.month || 1)}
                  onValueChange={(value) =>
                    updateConfig({ month: parseInt(value, 10) })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ].map((month, index) => (
                      <SelectItem key={month} value={String(index + 1)}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Day</label>
                <Select
                  value={String(config.day || 1)}
                  onValueChange={(value) =>
                    updateConfig({ day: parseInt(value, 10) })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        {day}
                        {getOrdinalSuffix(day)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (frequencyType === "quarterly") {
      const config = form.watch("frequency_config") as any;
      if (!config) return null;

      return (
        <div className="space-y-4">
          <div>
            <Label>Quarterly Schedule</Label>
            <div className="space-y-4 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="regular-quarterly"
                  checked={config.quarterly_type === "regular"}
                  onChange={() => updateConfig({ quarterly_type: "regular" })}
                  className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex items-center space-x-2">
                  <label
                    htmlFor="regular-quarterly"
                    className="text-sm font-medium"
                  >
                    Regular (same day each quarter)
                  </label>
                  {config.quarterly_type === "regular" && (
                    <Select
                      value={String(config.day_of_month || 1)}
                      onValueChange={(value) =>
                        updateConfig({ day_of_month: parseInt(value, 10) })
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(
                          (day) => (
                            <SelectItem key={day} value={String(day)}>
                              {day}
                              {getOrdinalSuffix(day)}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="custom-quarterly"
                  checked={config.quarterly_type === "custom"}
                  onChange={() => updateConfig({ quarterly_type: "custom" })}
                  className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="custom-quarterly"
                  className="text-sm font-medium"
                >
                  Custom dates
                </label>
              </div>

              {config.quarterly_type === "custom" && (
                <div className="space-y-4 pl-6">
                  {["Q1", "Q2", "Q3", "Q4"].map((quarter, index) => (
                    <div key={quarter}>
                      <label className="block text-sm font-medium mb-2">
                        {quarter} Payment Date
                      </label>
                      <Input
                        type="date"
                        value={(config.custom_dates || [])[index] || ""}
                        onChange={(e) => {
                          const dates = [
                            ...(config.custom_dates || Array(4).fill("")),
                          ];
                          dates[index] = e.target.value;
                          updateConfig({ custom_dates: dates });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (frequencyType === "per_paycheck") {
      const config = form.watch("frequency_config") as any;
      if (!config) return null;

      return (
        <div className="space-y-4">
          <div>
            <Label>Per Paycheck Settings</Label>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  When to process
                </label>
                <Select
                  value={config.trigger || "period_start"}
                  onValueChange={(value) =>
                    updateConfig({
                      trigger: value as "period_start" | "pay_date",
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="period_start">
                      At period start
                    </SelectItem>
                    <SelectItem value="pay_date">On pay date</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  {config.trigger === "period_start"
                    ? "Process when the budget period starts"
                    : "Process on the actual pay date"}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Income Name</Label>
          <Input
            {...form.register("name")}
            id="name"
            placeholder="e.g., Main Job"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            {...form.register("amount", { valueAsNumber: true })}
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
          {form.formState.errors.amount && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.amount.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="frequency_type">Frequency</Label>
          <Select
            value={form.watch("frequency_type") || ""}
            onValueChange={handleFrequencyTypeChange}
          >
            <SelectTrigger id="frequency_type">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {getFrequencyOptions()
                .filter((option) => option.value !== "per_paycheck")
                .map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {form.watch("frequency_type") && (
          <div className="pt-2">
            {renderFrequencyFields(form.watch("frequency_type")!)}
          </div>
        )}

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {submitLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
