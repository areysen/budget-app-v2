"use client";

import React, { forwardRef, useImperativeHandle } from "react";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useBudgetSetup } from "../budget-setup-context";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FrequencyType, FrequencyConfig } from "@/types/frequency";
import {
  createFrequencyConfig,
  formatFrequencyDisplay,
  getFrequencyOptions,
  getDayOfWeekOptions,
  getDayOptions,
} from "@/lib/utils/frequency-helpers";
import { frequencyCalculator } from "@/lib/services/frequency-calculator";

const incomeSourceSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    amount: z.coerce.number().min(0, "Amount must be positive"),
    frequency_type: z
      .enum([
        "monthly",
        "biweekly",
        "weekly",
        "semi_monthly",
        "quarterly",
        "yearly",
        "per_paycheck",
      ])
      .nullable(),
    frequency_config: z.any().nullable(), // JSON config object - required when frequency_type is set
    anchor_date: z.union([z.string(), z.null()]),
    next_payment_date: z.union([z.string(), z.null()]),
  })
  .refine(
    (data) => {
      // If frequency_type is set, frequency_config must also be set
      if (data.frequency_type && !data.frequency_config) {
        return false;
      }
      return true;
    },
    {
      message:
        "Frequency configuration is required when frequency type is selected",
      path: ["frequency_config"],
    }
  );

const incomeStepSchema = z.object({
  primaryIncome: incomeSourceSchema,
  secondaryIncomes: z.array(incomeSourceSchema),
});

type IncomeStepFormData = z.infer<typeof incomeStepSchema>;

interface StepIncomeProps {
  householdId: string;
  onComplete: () => void;
}

const StepIncome = forwardRef(function StepIncome(
  { householdId, onComplete }: StepIncomeProps,
  ref
) {
  const { getStepData, setStepData } = useBudgetSetup();
  const existingData = getStepData("income");
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("🟡 Existing data:", existingData);

  // Transform existing data to ensure it has the correct structure
  const transformedExistingData = existingData
    ? {
        primaryIncome: {
          ...existingData.primaryIncome,
          anchor_date: existingData.primaryIncome.anchor_date || null,
          next_payment_date:
            existingData.primaryIncome.next_payment_date || null,
        },
        secondaryIncomes: existingData.secondaryIncomes.map((income) => ({
          ...income,
          anchor_date: income.anchor_date || null,
          next_payment_date: income.next_payment_date || null,
        })),
      }
    : null;

  console.log("🟡 Transformed existing data:", transformedExistingData);

  const form = useForm<IncomeStepFormData>({
    resolver: zodResolver(incomeStepSchema),
    defaultValues: transformedExistingData || {
      primaryIncome: {
        name: "",
        amount: 0,
        frequency_type: "semi_monthly",
        frequency_config: createFrequencyConfig.semiMonthly(1, 15, false),
        anchor_date: null,
        next_payment_date: null,
      },
      secondaryIncomes: [],
    },
  });

  console.log("🟡 Form default values:", form.getValues());

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "secondaryIncomes",
  });

  const onSubmit = async (data: IncomeStepFormData) => {
    console.log("🟡 onSubmit called with data:", data);
    try {
      setIsSubmitting(true);

      // Ensure frequency_config is always provided for context
      const contextData = {
        primaryIncome: {
          ...data.primaryIncome,
          frequency_config: data.primaryIncome.frequency_config || null,
        },
        secondaryIncomes: data.secondaryIncomes.map((income) => ({
          ...income,
          frequency_config: income.frequency_config || null,
        })),
      };

      setStepData("income", contextData);

      const response = await fetch("/api/budget-setup/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId,
          ...data,
        }),
      });
      if (!response.ok) throw new Error("Failed to save income sources");
      console.log("🟡 API call successful");
      onComplete();
    } catch (error) {
      console.log("🔴 API call failed:", error);
      toast.error("Failed to save income sources. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    submit: async () => {
      console.log("🟢 StepIncome submit method called");
      console.log("🟢 Form state:", form.formState);
      console.log("🟢 Form errors:", form.formState.errors);
      console.log("🟢 Current form values:", form.getValues());
      console.log("🟢 Primary income values:", form.getValues("primaryIncome"));
      console.log(
        "🟢 Secondary incomes values:",
        form.getValues("secondaryIncomes")
      );
      console.log(
        "🟢 Primary income keys:",
        Object.keys(form.getValues("primaryIncome"))
      );
      console.log(
        "🟢 Primary income anchor_date:",
        form.getValues("primaryIncome.anchor_date")
      );
      console.log(
        "🟢 Primary income next_payment_date:",
        form.getValues("primaryIncome.next_payment_date")
      );

      // Use trigger to validate the form first
      const isValid = await form.trigger();
      console.log("🟢 Form validation result:", isValid);
      console.log("🟢 Form errors after trigger:", form.formState.errors);

      if (isValid) {
        // If valid, get the form data and call onSubmit directly
        const formData = form.getValues();
        console.log("🟢 Form data:", formData);
        await onSubmit(formData);
      } else {
        console.log("🔴 Form validation failed:", form.formState.errors);
        console.log(
          "🔴 Detailed errors:",
          JSON.stringify(form.formState.errors, null, 2)
        );
        toast.error("Please fix the form errors before continuing.");
      }
    },
  }));

  // Helper for rendering frequency fields
  function renderFrequencyFields(
    prefix: "primaryIncome" | number,
    frequencyType: string
  ) {
    const getField = (field: string) =>
      typeof prefix === "number"
        ? (`secondaryIncomes.${prefix}.${field}` as const)
        : (`primaryIncome.${field}` as const);

    // Helper to update frequency config for primary or secondary
    function updateConfig(configUpdates: Partial<FrequencyConfig>) {
      const currentConfig =
        typeof prefix === "number"
          ? form.watch(`secondaryIncomes.${prefix}.frequency_config`)
          : form.watch("primaryIncome.frequency_config");
      let newConfig: FrequencyConfig = { ...currentConfig, ...configUpdates };
      if (frequencyType === "monthly") {
        const monthlyUpdates = configUpdates as Partial<
          import("@/types/frequency").MonthlyConfig
        >;
        if (monthlyUpdates.is_end_of_month) {
          newConfig = {
            type: "monthly",
            day_of_month: null,
            is_end_of_month: true,
          };
        } else {
          const dayOfMonth =
            monthlyUpdates.day_of_month ||
            (currentConfig as any).day_of_month ||
            1;
          newConfig = {
            type: "monthly",
            day_of_month: dayOfMonth,
            is_end_of_month: false,
          };
        }
      } else if (frequencyType === "semi_monthly") {
        const semiMonthlyUpdates = configUpdates as Partial<
          import("@/types/frequency").SemiMonthlyConfig
        >;
        newConfig = {
          type: "semi_monthly",
          first_day:
            semiMonthlyUpdates.first_day ||
            (currentConfig as any).first_day ||
            1,
          second_day: semiMonthlyUpdates.second_is_eom
            ? null
            : semiMonthlyUpdates.second_day ||
              (currentConfig as any).second_day ||
              15,
          second_is_eom: semiMonthlyUpdates.second_is_eom || false,
        };
      }
      if (typeof prefix === "number") {
        form.setValue(`secondaryIncomes.${prefix}.frequency_config`, newConfig);
      } else {
        form.setValue("primaryIncome.frequency_config", newConfig);
      }
    }

    if (frequencyType === "monthly") {
      const config =
        typeof prefix === "number"
          ? form.watch(`secondaryIncomes.${prefix}.frequency_config`)
          : form.watch("primaryIncome.frequency_config");
      const dayOfMonthValue =
        config.day_of_month && config.day_of_month > 0
          ? String(config.day_of_month)
          : "1";
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Schedule
            </label>
            <div className="space-y-3">
              {/* Specific Day Option */}
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`monthly_type_${prefix}`}
                  checked={!config.is_end_of_month}
                  onChange={() =>
                    updateConfig({
                      is_end_of_month: false,
                      day_of_month:
                        config.day_of_month && config.day_of_month > 0
                          ? config.day_of_month
                          : 1,
                    })
                  }
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    Specific day of month
                  </span>
                  {!config.is_end_of_month && (
                    <div className="mt-2 flex items-center space-x-2">
                      <Select
                        value={dayOfMonthValue}
                        onValueChange={(value) =>
                          updateConfig({ day_of_month: parseInt(value) })
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getDayOptions().map((option) => (
                            <SelectItem
                              key={String(option.value)}
                              value={String(option.value)}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-500">
                        of each month
                      </span>
                    </div>
                  )}
                </div>
              </label>

              {/* End of Month Option */}
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`monthly_type_${prefix}`}
                  checked={config.is_end_of_month}
                  onChange={() =>
                    updateConfig({
                      is_end_of_month: true,
                      day_of_month: null,
                    })
                  }
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium">End of month</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Last day of each month (Jan 31, Feb 28/29, Mar 31, Apr 30,
                    etc.)
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      );
    }

    if (frequencyType === "semi_monthly") {
      const config =
        typeof prefix === "number"
          ? form.watch(`secondaryIncomes.${prefix}.frequency_config`)
          : form.watch("primaryIncome.frequency_config");
      // Defensive: always use a valid string value for Select
      const firstDayValue =
        config.first_day && config.first_day > 0
          ? String(config.first_day)
          : "1";
      const secondDayValue =
        config.second_day && config.second_day > 0
          ? String(config.second_day)
          : "15";
      return (
        <div className="space-y-4">
          {/* First Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Payment
            </label>
            <div className="flex items-center space-x-2">
              <Select
                value={firstDayValue}
                onValueChange={(value) =>
                  updateConfig({ first_day: parseInt(value) })
                }
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getDayOptions().map((option) => (
                    <SelectItem
                      key={String(option.value)}
                      value={String(option.value)}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">of each month</span>
            </div>
          </div>

          {/* Second Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Second Payment
            </label>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`second_payment_type_${prefix}`}
                  checked={!config.second_is_eom}
                  onChange={() =>
                    updateConfig({
                      second_is_eom: false,
                      second_day:
                        config.second_day && config.second_day > 0
                          ? config.second_day
                          : 15,
                    })
                  }
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">Specific day</span>
                  {!config.second_is_eom && (
                    <div className="mt-2 flex items-center space-x-2">
                      <Select
                        value={secondDayValue}
                        onValueChange={(value) =>
                          updateConfig({ second_day: parseInt(value) })
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getDayOptions().map((option) => (
                            <SelectItem
                              key={String(option.value)}
                              value={String(option.value)}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-500">
                        of each month
                      </span>
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`second_payment_type_${prefix}`}
                  checked={config.second_is_eom}
                  onChange={() =>
                    updateConfig({
                      second_is_eom: true,
                      second_day: null,
                    })
                  }
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium">End of month</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Last day of each month
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      );
    }

    if (frequencyType === "biweekly") {
      return (
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <Label htmlFor={getField("frequency_config.day_of_week")}>
              Day of Week
            </Label>
            <Select
              value={
                typeof prefix === "number"
                  ? form.watch(
                      `secondaryIncomes.${prefix}.frequency_config.day_of_week`
                    ) || ""
                  : form.watch("primaryIncome.frequency_config.day_of_week") ||
                    ""
              }
              onValueChange={(value) => {
                const config =
                  typeof prefix === "number"
                    ? form.watch(`secondaryIncomes.${prefix}.frequency_config`)
                    : form.watch("primaryIncome.frequency_config");

                const newConfig = {
                  ...config,
                  day_of_week: value,
                };

                if (typeof prefix === "number") {
                  form.setValue(
                    `secondaryIncomes.${prefix}.frequency_config`,
                    newConfig
                  );
                } else {
                  form.setValue("primaryIncome.frequency_config", newConfig);
                }
              }}
            >
              <SelectTrigger id={getField("frequency_config.day_of_week")}>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {getDayOfWeekOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={getField("anchor_date")}>First Pay Date</Label>
            <Input
              type="date"
              {...form.register(getField("anchor_date") as any)}
              id={getField("anchor_date")}
            />
          </div>
        </div>
      );
    }

    if (frequencyType === "weekly") {
      return (
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <Label htmlFor={getField("frequency_config.day_of_week")}>
              Day of Week
            </Label>
            <Select
              value={
                typeof prefix === "number"
                  ? form.watch(
                      `secondaryIncomes.${prefix}.frequency_config.day_of_week`
                    ) || ""
                  : form.watch("primaryIncome.frequency_config.day_of_week") ||
                    ""
              }
              onValueChange={(value) => {
                const config =
                  typeof prefix === "number"
                    ? form.watch(`secondaryIncomes.${prefix}.frequency_config`)
                    : form.watch("primaryIncome.frequency_config");

                const newConfig = {
                  ...config,
                  day_of_week: value,
                };

                if (typeof prefix === "number") {
                  form.setValue(
                    `secondaryIncomes.${prefix}.frequency_config`,
                    newConfig
                  );
                } else {
                  form.setValue("primaryIncome.frequency_config", newConfig);
                }
              }}
            >
              <SelectTrigger id={getField("frequency_config.day_of_week")}>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {getDayOfWeekOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={getField("anchor_date")}>First Pay Date</Label>
            <Input
              type="date"
              {...form.register(getField("anchor_date") as any)}
              id={getField("anchor_date")}
            />
          </div>
        </div>
      );
    }

    if (frequencyType === "per_paycheck") {
      return (
        <div>
          <Label htmlFor={getField("frequency_config.trigger")}>Trigger</Label>
          <Select
            value={
              typeof prefix === "number"
                ? form.watch(
                    `secondaryIncomes.${prefix}.frequency_config.trigger`
                  )
                : form.watch("primaryIncome.frequency_config.trigger")
            }
            onValueChange={(value) => {
              const config =
                typeof prefix === "number"
                  ? form.watch(`secondaryIncomes.${prefix}.frequency_config`)
                  : form.watch("primaryIncome.frequency_config");

              const newConfig = {
                ...config,
                trigger: value as "period_start" | "pay_date",
              };

              if (typeof prefix === "number") {
                form.setValue(
                  `secondaryIncomes.${prefix}.frequency_config`,
                  newConfig
                );
              } else {
                form.setValue("primaryIncome.frequency_config", newConfig);
              }
            }}
          >
            <SelectTrigger id={getField("frequency_config.trigger")}>
              <SelectValue placeholder="Select trigger" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="period_start">Start of Pay Period</SelectItem>
              <SelectItem value="pay_date">Pay Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    return null;
  }

  const handleFrequencyTypeChange = (
    prefix: "primaryIncome" | number,
    type: string
  ) => {
    if (!type) {
      if (typeof prefix === "number") {
        form.setValue(`secondaryIncomes.${prefix}.frequency_type`, null);
        form.setValue(`secondaryIncomes.${prefix}.frequency_config`, null);
      } else {
        form.setValue("primaryIncome.frequency_type", null);
        form.setValue("primaryIncome.frequency_config", null);
      }
      return;
    }

    const frequencyType = type as FrequencyType;

    // Set default config based on type
    let defaultConfig: FrequencyConfig;
    switch (frequencyType) {
      case "monthly":
        defaultConfig = createFrequencyConfig.monthly(1, false);
        break;
      case "biweekly":
        defaultConfig = createFrequencyConfig.biweekly("monday", "");
        break;
      case "weekly":
        defaultConfig = createFrequencyConfig.weekly("monday");
        break;
      case "semi_monthly":
        defaultConfig = createFrequencyConfig.semiMonthly(1, 15, false);
        break;
      case "quarterly":
        defaultConfig = createFrequencyConfig.quarterly("regular", 15);
        break;
      case "yearly":
        defaultConfig = createFrequencyConfig.yearly(1, 1);
        break;
      case "per_paycheck":
        defaultConfig = createFrequencyConfig.perPaycheck("period_start");
        break;
      default:
        return;
    }

    if (typeof prefix === "number") {
      form.setValue(`secondaryIncomes.${prefix}.frequency_type`, frequencyType);
      form.setValue(
        `secondaryIncomes.${prefix}.frequency_config`,
        defaultConfig
      );
    } else {
      form.setValue("primaryIncome.frequency_type", frequencyType);
      form.setValue("primaryIncome.frequency_config", defaultConfig);
    }
  };

  const addSecondaryIncome = () => {
    append({
      name: "",
      amount: 0,
      frequency_type: "semi_monthly",
      frequency_config: createFrequencyConfig.semiMonthly(1, 15, false),
      anchor_date: null,
      next_payment_date: null,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Income Sources</h2>
        <p className="text-gray-600 mt-2">
          Set up your primary and any secondary income sources.
        </p>
      </div>

      {/* Primary Income */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Primary Income
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="primaryIncome.name">Income Name</Label>
            <Input
              {...form.register("primaryIncome.name")}
              id="primaryIncome.name"
              placeholder="e.g., Main Job"
            />
            {form.formState.errors.primaryIncome?.name && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.primaryIncome.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="primaryIncome.amount">Amount</Label>
            <Input
              {...form.register("primaryIncome.amount", {
                valueAsNumber: true,
              })}
              id="primaryIncome.amount"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
            {form.formState.errors.primaryIncome?.amount && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.primaryIncome.amount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="primaryIncome.frequency_type">Frequency</Label>
            <Select
              value={form.watch("primaryIncome.frequency_type") || ""}
              onValueChange={(value) =>
                handleFrequencyTypeChange("primaryIncome", value)
              }
            >
              <SelectTrigger id="primaryIncome.frequency_type">
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

          {form.watch("primaryIncome.frequency_type") && (
            <div className="pt-2">
              {renderFrequencyFields(
                "primaryIncome",
                form.watch("primaryIncome.frequency_type")!
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Secondary Incomes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Secondary Income
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSecondaryIncome}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Income
          </Button>
        </div>

        {fields.map((field, index) => (
          <Card key={field.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                Secondary Income {index + 1}
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor={`secondaryIncomes.${index}.name`}>
                  Income Name
                </Label>
                <Input
                  {...form.register(`secondaryIncomes.${index}.name`)}
                  id={`secondaryIncomes.${index}.name`}
                  placeholder="e.g., Side Gig"
                />
                {form.formState.errors.secondaryIncomes?.[index]?.name && (
                  <p className="text-sm text-destructive mt-1">
                    {
                      form.formState.errors.secondaryIncomes[index]?.name
                        ?.message
                    }
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={`secondaryIncomes.${index}.amount`}>
                  Amount
                </Label>
                <Input
                  {...form.register(`secondaryIncomes.${index}.amount`, {
                    valueAsNumber: true,
                  })}
                  id={`secondaryIncomes.${index}.amount`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
                {form.formState.errors.secondaryIncomes?.[index]?.amount && (
                  <p className="text-sm text-destructive mt-1">
                    {
                      form.formState.errors.secondaryIncomes[index]?.amount
                        ?.message
                    }
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={`secondaryIncomes.${index}.frequency_type`}>
                  Frequency
                </Label>
                <Select
                  value={
                    form.watch(`secondaryIncomes.${index}.frequency_type`) || ""
                  }
                  onValueChange={(value) =>
                    handleFrequencyTypeChange(index, value)
                  }
                >
                  <SelectTrigger
                    id={`secondaryIncomes.${index}.frequency_type`}
                  >
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFrequencyOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.watch(`secondaryIncomes.${index}.frequency_type`) && (
                <div className="pt-2">
                  {renderFrequencyFields(
                    index,
                    form.watch(`secondaryIncomes.${index}.frequency_type`)!
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {isSubmitting && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  );
});

export { StepIncome };
