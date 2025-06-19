"use client";

import React, { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { FrequencyType, FrequencyConfig } from "@/types/frequency";
import {
  createFrequencyConfig,
  validateFrequencyConfig,
} from "@/lib/utils/frequency-helpers";
import { CategorySelector } from "@/components/forms/category-selector";
import { FrequencyPreview } from "@/components/forms/frequency-preview";
import { supabase } from "@/lib/supabase/client";
import { Tables } from "@/types/supabase";
import { useUser } from "@/hooks/use-user";

// Form schema that matches database types
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.number().min(0, "Amount must be greater than 0"),
  isVariable: z.boolean(),
  notes: z.string().optional(),
  frequency_type: z
    .enum([
      "monthly",
      "biweekly",
      "weekly",
      "semi_monthly",
      "quarterly",
      "yearly",
      "per_paycheck",
    ] as const)
    .nullable(),
  frequency_config: z.any().nullable(), // JSON config object
  anchor_date: z.string().nullable(),
  next_due_date: z.string().nullable(),
});

type FormSchema = z.infer<typeof formSchema>;

type FixedExpenseFormProps = {
  expense?: Tables<"fixed_expenses">;
  onSave: (data: FormSchema) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
};

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

export function FixedExpenseForm({
  expense,
  onSave,
  onCancel,
  saving = false,
}: FixedExpenseFormProps) {
  const { householdId, loading: userLoading, error: userError } = useUser();
  const [availableCategories, setAvailableCategories] = React.useState<
    string[]
  >([]);
  const [loadingCategories, setLoadingCategories] = React.useState(true);
  const [categoryError, setCategoryError] = React.useState<string | null>(null);

  // Form title based on whether we're editing or creating
  const formTitle = expense ? "Edit Expense" : "Add New Expense";

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: expense?.name || "",
      category: expense?.category || "",
      amount: expense?.estimated_amount || 0,
      isVariable: expense?.is_variable ?? false,
      notes: expense?.notes || "",
      frequency_type:
        (expense?.frequency_type as FormSchema["frequency_type"]) || "monthly",
      frequency_config:
        expense?.frequency_config || createFrequencyConfig.monthly(1),
      anchor_date: expense?.anchor_date || null,
      next_due_date: expense?.next_due_date || null,
    },
  });

  // Load categories only after we have householdId and user is loaded
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      if (!householdId) return;

      try {
        setLoadingCategories(true);
        setCategoryError(null);
        const categories = await fetchCategories(householdId);
        if (isMounted) {
          setAvailableCategories(categories);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        if (isMounted) {
          setCategoryError("Failed to load categories");
          toast.error("Failed to load categories");
        }
      } finally {
        if (isMounted) {
          setLoadingCategories(false);
        }
      }
    };

    // Only load categories if we have householdId and user is loaded
    if (householdId && !userLoading) {
      loadCategories();
    }

    return () => {
      isMounted = false;
    };
  }, [householdId, userLoading]);

  // Set initial frequency config if not provided
  useEffect(() => {
    const currentConfig = form.getValues("frequency_config");
    const currentType = form.getValues("frequency_type");

    if (!currentConfig && currentType) {
      handleFrequencyTypeChange(currentType);
    }
  }, []);

  const handleSubmit: SubmitHandler<FormSchema> = async (data) => {
    if (!data.frequency_type || !data.frequency_config) {
      toast.error("Please configure the frequency");
      return;
    }

    if (!validateFrequencyConfig(data.frequency_type, data.frequency_config)) {
      toast.error("Invalid frequency configuration");
      return;
    }

    // Ensure custom category exists
    if (data.category && householdId) {
      await ensureCategoryExists(data.category, householdId);
    }

    await onSave(data);
  };

  const handleFrequencyTypeChange = (type: FormSchema["frequency_type"]) => {
    if (!type) return;

    form.setValue("frequency_type", type);

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
          createFrequencyConfig.biweekly(
            "monday",
            new Date().toISOString().split("T")[0]
          )
        );
        break;
      case "weekly":
        form.setValue(
          "frequency_config",
          createFrequencyConfig.weekly("monday")
        );
        break;
      case "semi_monthly":
        form.setValue(
          "frequency_config",
          createFrequencyConfig.semiMonthly(1, 15)
        );
        break;
      case "quarterly":
        form.setValue(
          "frequency_config",
          createFrequencyConfig.quarterly("regular")
        );
        break;
      case "yearly":
        form.setValue("frequency_config", createFrequencyConfig.yearly(1, 1));
        break;
      case "per_paycheck":
        form.setValue("frequency_config", createFrequencyConfig.perPaycheck());
        break;
    }
  };

  const updateConfig = (configUpdates: Partial<FrequencyConfig>) => {
    const currentType = form.getValues("frequency_type");
    const currentConfig = form.getValues("frequency_config") as FrequencyConfig;

    if (!currentType || !currentConfig) return;

    let newConfig: FrequencyConfig;
    switch (currentType) {
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
            "monday",
          new Date().toISOString().split("T")[0]
        );
        break;
      case "weekly":
        newConfig = createFrequencyConfig.weekly(
          configUpdates.day_of_week ||
            (currentConfig as any).day_of_week ||
            "monday"
        );
        break;
      case "semi_monthly":
        newConfig = createFrequencyConfig.semiMonthly(
          configUpdates.first_day || (currentConfig as any).first_day || 1,
          configUpdates.second_is_eom ||
            (currentConfig as any).second_is_eom ||
            false
        );
        break;
      case "quarterly":
        newConfig = createFrequencyConfig.quarterly(
          configUpdates.quarter_type ||
            (currentConfig as any).quarter_type ||
            "regular",
          configUpdates.day_of_quarter ||
            (currentConfig as any).day_of_quarter ||
            15
        );
        break;
      case "yearly":
        newConfig = createFrequencyConfig.yearly(
          configUpdates.month || (currentConfig as any).month || 1,
          configUpdates.day || (currentConfig as any).day || 1
        );
        break;
      case "per_paycheck":
        newConfig = createFrequencyConfig.perPaycheck(
          configUpdates.paycheck_trigger ||
            (currentConfig as any).paycheck_trigger ||
            "period_start"
        );
        break;
      default:
        return;
    }

    form.setValue("frequency_config", newConfig);
  };

  const renderFrequencyFields = (frequencyType: string) => {
    const config = form.watch("frequency_config") as FrequencyConfig;

    switch (frequencyType) {
      case "monthly":
        return (
          <div className="space-y-2">
            <Label>Day of Month</Label>
            <div className="flex gap-2">
              <Checkbox
                checked={(config as any)?.is_end_of_month || false}
                onCheckedChange={(checked) =>
                  updateConfig({ is_end_of_month: checked as boolean })
                }
              />
              <Label className="text-sm">End of month</Label>
            </div>
            {!(config as any)?.is_end_of_month && (
              <Input
                type="number"
                min="1"
                max="31"
                value={(config as any)?.day_of_month || 1}
                onChange={(e) =>
                  updateConfig({ day_of_month: parseInt(e.target.value) })
                }
                className="w-20"
              />
            )}
          </div>
        );

      case "biweekly":
        return (
          <div className="space-y-2">
            <Label>Day of Week</Label>
            <select
              value={(config as any)?.day_of_week || "monday"}
              onChange={(e) => updateConfig({ day_of_week: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
        );

      case "weekly":
        return (
          <div className="space-y-2">
            <Label>Day of Week</Label>
            <select
              value={(config as any)?.day_of_week || "monday"}
              onChange={(e) => updateConfig({ day_of_week: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
        );

      case "semi_monthly":
        return (
          <div className="space-y-2">
            <Label>First Payment Day</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={(config as any)?.first_day || 1}
              onChange={(e) =>
                updateConfig({ first_day: parseInt(e.target.value) })
              }
              className="w-20"
            />
            <div className="flex gap-2">
              <Checkbox
                checked={(config as any)?.second_is_eom || false}
                onCheckedChange={(checked) =>
                  updateConfig({ second_is_eom: checked as boolean })
                }
              />
              <Label className="text-sm">
                Second payment on last day of month
              </Label>
            </div>
          </div>
        );

      case "quarterly":
        return (
          <div className="space-y-2">
            <Label>Quarter Type</Label>
            <select
              value={(config as any)?.quarter_type || "regular"}
              onChange={(e) => updateConfig({ quarter_type: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="regular">Regular (Jan, Apr, Jul, Oct)</option>
              <option value="fiscal">Fiscal (Feb, May, Aug, Nov)</option>
            </select>
            <Label>Day of Quarter</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={(config as any)?.day_of_quarter || 15}
              onChange={(e) =>
                updateConfig({ day_of_quarter: parseInt(e.target.value) })
              }
              className="w-20"
            />
          </div>
        );

      case "yearly":
        return (
          <div className="space-y-2">
            <Label>Month</Label>
            <select
              value={(config as any)?.month || 1}
              onChange={(e) =>
                updateConfig({ month: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded-md"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i, 1).toLocaleDateString("en-US", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
            <Label>Day</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={(config as any)?.day || 1}
              onChange={(e) => updateConfig({ day: parseInt(e.target.value) })}
              className="w-20"
            />
          </div>
        );

      case "per_paycheck":
        return (
          <div className="space-y-2">
            <Label>Paycheck Trigger</Label>
            <select
              value={(config as any)?.paycheck_trigger || "period_start"}
              onChange={(e) =>
                updateConfig({ paycheck_trigger: e.target.value })
              }
              className="w-full p-2 border rounded-md"
            >
              <option value="period_start">At period start</option>
              <option value="period_end">At period end</option>
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">{formTitle}</h2>
        </div>

        {/* Show loading state while user data is loading */}
        {userLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : userError ? (
          <div className="text-destructive text-center py-4">{userError}</div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    className={
                      form.formState.errors.name ? "border-destructive" : ""
                    }
                  />
                  {form.formState.errors.name && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <CategorySelector
                    value={form.getValues("category")}
                    onChange={(value) => form.setValue("category", value)}
                    availableCategories={availableCategories}
                    loading={loadingCategories}
                    error={form.formState.errors.category?.message}
                    categoryError={categoryError}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      className="pl-8"
                      {...form.register("amount", { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                  {form.formState.errors.amount && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.amount.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isVariable">Variable Amount</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isVariable"
                      checked={form.getValues("isVariable")}
                      onCheckedChange={(checked) =>
                        form.setValue("isVariable", checked as boolean)
                      }
                    />
                    <Label htmlFor="isVariable">
                      Amount varies month to month
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Frequency & Due Date</h4>

                <div className="space-y-2">
                  <Label>Frequency Type</Label>
                  <select
                    value={form.watch("frequency_type") || ""}
                    onChange={(e) =>
                      handleFrequencyTypeChange(
                        e.target.value as FormSchema["frequency_type"]
                      )
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select frequency...</option>
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="weekly">Weekly</option>
                    <option value="semi_monthly">Semi-monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="per_paycheck">Per Paycheck</option>
                  </select>
                </div>

                {form.watch("frequency_type") && (
                  <div className="space-y-2">
                    {renderFrequencyFields(form.watch("frequency_type")!)}
                    <FrequencyPreview
                      frequencyType={form.watch("frequency_type")}
                      frequencyConfig={form.watch("frequency_config")}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  {...form.register("notes")}
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || userLoading}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </>
        )}
      </form>
    </Card>
  );
}
