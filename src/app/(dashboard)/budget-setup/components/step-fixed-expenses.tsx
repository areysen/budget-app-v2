"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useBudgetSetup } from "../budget-setup-context";
import { supabase } from "@/lib/supabase/client";
import { FrequencyType, FrequencyConfig } from "@/types/frequency";
import {
  createFrequencyConfig,
  formatFrequencyDisplay,
  getDayOptions,
} from "@/lib/utils/frequency-helpers";
import { frequencyCalculator } from "@/lib/services/frequency-calculator";

// Enhanced schema with frequency system
const fixedExpenseSchema = z.object({
  expenses: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        category: z.string().min(1, "Category is required"),
        amount: z.coerce.number().min(0, "Amount must be positive"),
        isVariable: z.boolean(),
        notes: z.string().optional(),

        // Enhanced frequency fields
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
        frequency_config: z.any(), // JSON config object - required when frequency_type is set
        anchor_date: z.string().nullable(),
        next_due_date: z.string().nullable(),

        // Backward compatibility
        dueDay: z.number().min(1).max(31).optional(),
        frequency: z.enum(["monthly", "quarterly", "annual"]).optional(),
      })
    )
    .min(1, "At least one fixed expense is required"),
});

type FixedExpenseFormData = z.infer<typeof fixedExpenseSchema>;

interface StepFixedExpensesProps {
  householdId: string;
  onComplete: () => void;
}

type CategoryRow = { name: string };
const fetchCategories = async (householdId: string) => {
  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .eq("category_type", "fixed_expense")
    .or(`is_system_default.eq.true,household_id.eq.${householdId}`)
    .order("sort_order");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return (data as CategoryRow[] | null)?.map((cat) => cat.name) || [];
};

const ensureCategoryExists = async (
  categoryName: string,
  householdId: string
) => {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("name", categoryName)
    .eq("category_type", "fixed_expense")
    .or(`is_system_default.eq.true,household_id.eq.${householdId}`);

  if (!existing?.length) {
    const { error } = await supabase.from("categories").insert({
      name: categoryName,
      category_type: "fixed_expense",
      household_id: householdId,
      is_system_default: false,
    });
    if (error) {
      console.error("Error creating custom category:", error);
    }
  }
};

// Frequency Selection Component
interface FrequencySelectionSectionProps {
  index: number;
  form: ReturnType<typeof useForm<FixedExpenseFormData>>;
}

function FrequencySelectionSection({
  index,
  form,
}: FrequencySelectionSectionProps) {
  const frequencyType = form.watch(`expenses.${index}.frequency_type`);
  const frequencyConfig = form.watch(`expenses.${index}.frequency_config`);

  const handleFrequencyTypeChange = (type: string) => {
    if (!type) {
      form.setValue(`expenses.${index}.frequency_type`, null);
      form.setValue(`expenses.${index}.frequency_config`, null);
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
        defaultConfig = createFrequencyConfig.biweekly(
          "monday",
          new Date().toISOString().split("T")[0]
        );
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

    form.setValue(`expenses.${index}.frequency_type`, frequencyType);
    form.setValue(`expenses.${index}.frequency_config`, defaultConfig);

    // Calculate next due date (except for per-paycheck items)
    if (frequencyType !== "per_paycheck") {
      try {
        const nextDate = frequencyCalculator.calculateNextOccurrence({
          id: "temp",
          frequency_type: frequencyType,
          frequency_config: defaultConfig,
          anchor_date:
            frequencyType === "biweekly"
              ? new Date().toISOString().split("T")[0]
              : null,
        } as any);
        form.setValue(
          `expenses.${index}.next_due_date`,
          nextDate.toISOString().split("T")[0]
        );
      } catch (error) {
        console.error("Error calculating next due date:", error);
      }
    } else {
      // For per-paycheck items, set next_due_date to null since it depends on paycheck periods
      form.setValue(`expenses.${index}.next_due_date`, null);
    }
  };

  const updateConfig = (configUpdates: Partial<FrequencyConfig>) => {
    if (!frequencyType || !frequencyConfig) return;

    let newConfig: FrequencyConfig = { ...frequencyConfig, ...configUpdates };
    // Enhanced EOM logic for monthly and semi-monthly
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
          (frequencyConfig as any).day_of_month ||
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
          (frequencyConfig as any).first_day ||
          1,
        second_day: semiMonthlyUpdates.second_is_eom
          ? null
          : semiMonthlyUpdates.second_day ||
            (frequencyConfig as any).second_day ||
            15,
        second_is_eom: semiMonthlyUpdates.second_is_eom || false,
      };
    }

    form.setValue(`expenses.${index}.frequency_config`, newConfig);

    // Recalculate next due date (except for per-paycheck items)
    if (frequencyType !== "per_paycheck") {
      try {
        const nextDate = frequencyCalculator.calculateNextOccurrence({
          id: "temp",
          frequency_type: frequencyType,
          frequency_config: newConfig,
          anchor_date: form.watch(`expenses.${index}.anchor_date`),
        } as any);
        form.setValue(
          `expenses.${index}.next_due_date`,
          nextDate.toISOString().split("T")[0]
        );
      } catch (error) {
        console.error("Error calculating next due date:", error);
      }
    } else {
      // For per-paycheck items, set next_due_date to null since it depends on paycheck periods
      form.setValue(`expenses.${index}.next_due_date`, null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Frequency Type Selection */}
      <div>
        <Label htmlFor={`expenses.${index}.frequency_type`}>Frequency</Label>
        <Select
          value={frequencyType || ""}
          onValueChange={handleFrequencyTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="biweekly">Bi-weekly</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="semi_monthly">Semi-monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
            <SelectItem value="per_paycheck">Per Paycheck</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dynamic Configuration Fields */}
      {frequencyType === "monthly" && frequencyConfig?.type === "monthly" && (
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
                  name={`monthly_type_${index}`}
                  checked={!frequencyConfig.is_end_of_month}
                  onChange={() =>
                    updateConfig({
                      is_end_of_month: false,
                      day_of_month:
                        frequencyConfig.day_of_month &&
                        frequencyConfig.day_of_month > 0
                          ? frequencyConfig.day_of_month
                          : 1,
                    })
                  }
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    Specific day of month
                  </span>
                  {!frequencyConfig.is_end_of_month && (
                    <div className="mt-2 flex items-center space-x-2">
                      <Select
                        value={
                          frequencyConfig.day_of_month &&
                          frequencyConfig.day_of_month > 0
                            ? String(frequencyConfig.day_of_month)
                            : "1"
                        }
                        onValueChange={(value) =>
                          updateConfig({ day_of_month: parseInt(value) })
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getDayOptions().map(
                            (option: { value: number; label: string }) => (
                              <SelectItem
                                key={String(option.value)}
                                value={String(option.value)}
                              >
                                {option.label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-500">
                        (e.g., 1st, 15th, 30th of each month)
                      </span>
                    </div>
                  )}
                </div>
              </label>

              {/* End of Month Option */}
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`monthly_type_${index}`}
                  checked={frequencyConfig.is_end_of_month}
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
      )}

      {(frequencyType === "biweekly" || frequencyType === "weekly") &&
        (frequencyConfig?.type === "biweekly" ||
          frequencyConfig?.type === "weekly") && (
          <div>
            <Label htmlFor={`expenses.${index}.dayOfWeek`}>Day of Week</Label>
            <Select
              value={frequencyConfig.day_of_week || ""}
              onValueChange={(value) => updateConfig({ day_of_week: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select day..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="tuesday">Tuesday</SelectItem>
                <SelectItem value="wednesday">Wednesday</SelectItem>
                <SelectItem value="thursday">Thursday</SelectItem>
                <SelectItem value="friday">Friday</SelectItem>
                <SelectItem value="saturday">Saturday</SelectItem>
                <SelectItem value="sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

      {frequencyType === "semi_monthly" &&
        frequencyConfig?.type === "semi_monthly" && (
          <div className="space-y-4">
            {/* First Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Payment
              </label>
              <div className="flex items-center space-x-2">
                <Select
                  value={
                    frequencyConfig.first_day && frequencyConfig.first_day > 0
                      ? String(frequencyConfig.first_day)
                      : "1"
                  }
                  onValueChange={(value) =>
                    updateConfig({ first_day: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getDayOptions().map(
                      (option: { value: number; label: string }) => (
                        <SelectItem
                          key={String(option.value)}
                          value={String(option.value)}
                        >
                          {option.label}
                        </SelectItem>
                      )
                    )}
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
                    name={`second_payment_type_${index}`}
                    checked={!frequencyConfig.second_is_eom}
                    onChange={() =>
                      updateConfig({
                        second_is_eom: false,
                        second_day:
                          frequencyConfig.second_day &&
                          frequencyConfig.second_day > 0
                            ? frequencyConfig.second_day
                            : 15,
                      })
                    }
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Specific day</span>
                    {!frequencyConfig.second_is_eom && (
                      <div className="mt-2 flex items-center space-x-2">
                        <Select
                          value={
                            frequencyConfig.second_day &&
                            frequencyConfig.second_day > 0
                              ? String(frequencyConfig.second_day)
                              : "15"
                          }
                          onValueChange={(value) =>
                            updateConfig({ second_day: parseInt(value) })
                          }
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getDayOptions().map(
                              (option: { value: number; label: string }) => (
                                <SelectItem
                                  key={String(option.value)}
                                  value={String(option.value)}
                                >
                                  {option.label}
                                </SelectItem>
                              )
                            )}
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
                    name={`second_payment_type_${index}`}
                    checked={frequencyConfig.second_is_eom}
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
        )}

      {frequencyType === "yearly" && frequencyConfig?.type === "yearly" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`expenses.${index}.yearlyMonth`}>Month</Label>
            <Select
              value={frequencyConfig.month.toString()}
              onValueChange={(value) =>
                updateConfig({ month: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(2024, i, 1).toLocaleString("default", {
                      month: "long",
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`expenses.${index}.yearlyDay`}>Day</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={frequencyConfig.day}
              onChange={(e) => updateConfig({ day: parseInt(e.target.value) })}
            />
          </div>
        </div>
      )}

      {frequencyType === "per_paycheck" &&
        frequencyConfig?.type === "per_paycheck" && (
          <div>
            <Label htmlFor={`expenses.${index}.paycheckTrigger`}>
              When to Apply
            </Label>
            <Select
              value={frequencyConfig.trigger}
              onValueChange={(value) =>
                updateConfig({ trigger: value as "period_start" | "pay_date" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trigger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="period_start">
                  Start of pay period
                </SelectItem>
                <SelectItem value="pay_date">Pay date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

      {/* Frequency Preview */}
      {frequencyType && frequencyConfig && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Frequency:</strong>{" "}
            {formatFrequencyDisplay(frequencyType, frequencyConfig)}
          </p>
          {frequencyType === "per_paycheck" && (
            <p className="text-xs text-blue-600 mt-1">
              Next due date will be calculated when paycheck periods are
              available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const StepFixedExpenses = forwardRef(function StepFixedExpenses(
  { householdId, onComplete }: StepFixedExpensesProps,
  ref
) {
  const { getStepData, setStepData } = useBudgetSetup();
  const existingData = getStepData("fixedExpenses");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const form = useForm<FixedExpenseFormData>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: existingData || {
      expenses: [
        {
          name: "",
          category: "",
          amount: 0,
          isVariable: false,
          frequency_type: "monthly",
          frequency_config: createFrequencyConfig.monthly(1),
          anchor_date: null,
          next_due_date: null,
        },
      ],
    },
  });

  useEffect(() => {
    const loadCategories = async () => {
      if (householdId) {
        const categories = await fetchCategories(householdId);
        setAvailableCategories(categories);
      }
    };
    loadCategories();
  }, [householdId]);

  const onSubmit = async (data: FixedExpenseFormData) => {
    try {
      // Ensure all custom categories exist
      for (const expense of data.expenses) {
        if (expense.category && expense.category !== "custom") {
          await ensureCategoryExists(expense.category, householdId);
        }
      }

      // Transform data to match interface requirements
      const transformedData = {
        householdId,
        expenses: data.expenses.map((expense) => ({
          name: expense.name,
          category: expense.category,
          amount: expense.amount,
          isVariable: expense.isVariable,
          notes: expense.notes || undefined,
          frequency_type: expense.frequency_type,
          frequency_config: expense.frequency_config,
          anchor_date: expense.anchor_date,
          next_due_date: expense.next_due_date,
          dueDay: expense.dueDay,
          frequency: expense.frequency,
        })),
      };

      // Save to context
      setStepData("fixedExpenses", transformedData);
      // Save to API
      const response = await fetch("/api/budget-setup/fixed-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData),
      });
      if (!response.ok) {
        throw new Error("Failed to save fixed expenses");
      }
      onComplete();
    } catch (error) {
      toast.error("Failed to save fixed expenses. Please try again.");
      console.error("Error saving fixed expenses:", error);
    }
  };

  const addExpense = () => {
    const currentExpenses = form.getValues("expenses");
    form.setValue("expenses", [
      ...currentExpenses,
      {
        name: "",
        category: "",
        amount: 0,
        isVariable: false,
        frequency_type: "monthly",
        frequency_config: createFrequencyConfig.monthly(1),
        anchor_date: null,
        next_due_date: null,
      },
    ]);
  };

  const removeExpense = (index: number) => {
    const currentExpenses = form.getValues("expenses");
    form.setValue(
      "expenses",
      currentExpenses.filter((_, i) => i !== index)
    );
  };

  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(onSubmit)(),
  }));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Fixed Expenses</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExpense}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>

        {form.watch("expenses").map((expense, index) => (
          <div key={index} className="grid gap-4 p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Expense #{index + 1}</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeExpense(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`expenses.${index}.name`}>Name</Label>
                <Input
                  id={`expenses.${index}.name`}
                  {...form.register(`expenses.${index}.name`)}
                  placeholder="e.g., Rent"
                />
                {form.formState.errors.expenses?.[index]?.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.expenses[index]?.name?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`expenses.${index}.category`}>Category</Label>
                <Select
                  value={expense.category || ""}
                  onValueChange={(value) => {
                    form.setValue(`expenses.${index}.category`, value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      + Add Custom Category
                    </SelectItem>
                  </SelectContent>
                </Select>
                {form.watch(`expenses.${index}.category`) === "custom" && (
                  <Input
                    placeholder="Enter custom category..."
                    onChange={(e) => {
                      form.setValue(
                        `expenses.${index}.category`,
                        e.target.value
                      );
                    }}
                  />
                )}
                {form.formState.errors.expenses?.[index]?.category && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.expenses[index]?.category?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`expenses.${index}.amount`}>Amount</Label>
                <Input
                  id={`expenses.${index}.amount`}
                  type="number"
                  {...form.register(`expenses.${index}.amount`, {
                    valueAsNumber: true,
                  })}
                  placeholder="e.g., 1000"
                />
                {form.formState.errors.expenses?.[index]?.amount && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.expenses[index]?.amount?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`expenses.${index}.isVariable`}>
                  Is Variable
                </Label>
                <Checkbox
                  id={`expenses.${index}.isVariable`}
                  {...form.register(`expenses.${index}.isVariable`)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`expenses.${index}.notes`}>
                  Notes (Optional)
                </Label>
                <Input
                  id={`expenses.${index}.notes`}
                  {...form.register(`expenses.${index}.notes`)}
                  placeholder="e.g., Varies by season"
                />
              </div>
            </div>

            {/* Enhanced Frequency Selection */}
            <div className="col-span-full">
              <FrequencySelectionSection index={index} form={form} />
            </div>
          </div>
        ))}
      </div>
    </form>
  );
});

export { StepFixedExpenses };
