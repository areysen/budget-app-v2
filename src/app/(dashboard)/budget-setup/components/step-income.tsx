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

const incomeSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(0, "Amount must be positive"),
  scheduleType: z.enum(["semi_monthly", "bi_weekly", "monthly", "one_time"]),
  biWeeklyDay: z
    .enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ])
    .optional(),
  biWeeklyStartDate: z.string().optional(),
  monthlyDay: z.number().optional(),
});

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

  const form = useForm<IncomeStepFormData>({
    resolver: zodResolver(incomeStepSchema),
    defaultValues: existingData || {
      primaryIncome: {
        name: "",
        amount: 0,
        scheduleType: "semi_monthly",
      },
      secondaryIncomes: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "secondaryIncomes",
  });

  const onSubmit = async (data: IncomeStepFormData) => {
    console.log("🟡 onSubmit called with data:", data);
    try {
      setIsSubmitting(true);
      setStepData("income", data);
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
    submit: () => {
      console.log("🟢 StepIncome submit method called");
      console.log("🟢 Form state:", form.formState);
      console.log("🟢 Form errors:", form.formState.errors);
      const handler = form.handleSubmit(onSubmit);
      console.log("🟢 handleSubmit returns:", handler);
      handler();
      console.log("🟢 handleSubmit called");
    },
  }));

  // Helper for rendering schedule fields
  function renderScheduleFields(
    prefix: "primaryIncome" | number,
    scheduleType: string
  ) {
    const getField = (field: string) =>
      typeof prefix === "number"
        ? (`secondaryIncomes.${prefix}.${field}` as const)
        : (`primaryIncome.${field}` as const);

    if (scheduleType === "bi_weekly") {
      return (
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <Label htmlFor={getField("biWeeklyDay")}>Day of Week</Label>
            <Select
              value={
                typeof prefix === "number"
                  ? form.watch(`secondaryIncomes.${prefix}.biWeeklyDay`) || ""
                  : form.watch("primaryIncome.biWeeklyDay") || ""
              }
              onValueChange={(value) =>
                typeof prefix === "number"
                  ? form.setValue(
                      `secondaryIncomes.${prefix}.biWeeklyDay`,
                      value as any
                    )
                  : form.setValue("primaryIncome.biWeeklyDay", value as any)
              }
            >
              <SelectTrigger id={getField("biWeeklyDay")}>
                <SelectValue placeholder="Select day" />
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
            {typeof prefix === "number"
              ? form.formState.errors.secondaryIncomes?.[prefix]
                  ?.biWeeklyDay && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors.secondaryIncomes[prefix]
                        ?.biWeeklyDay?.message
                    }
                  </p>
                )
              : form.formState.errors.primaryIncome?.biWeeklyDay && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.primaryIncome.biWeeklyDay?.message}
                  </p>
                )}
          </div>
          <div>
            <Label htmlFor={getField("biWeeklyStartDate")}>
              First Pay Date
            </Label>
            <Input
              type="date"
              {...form.register(getField("biWeeklyStartDate") as any)}
              id={getField("biWeeklyStartDate")}
            />
          </div>
        </div>
      );
    }
    if (scheduleType === "monthly") {
      return (
        <div>
          <Label htmlFor={getField("monthlyDay")}>Day of Month</Label>
          <Select
            value={
              typeof prefix === "number"
                ? form.watch(`secondaryIncomes.${prefix}.monthlyDay`) ===
                  undefined
                  ? ""
                  : String(form.watch(`secondaryIncomes.${prefix}.monthlyDay`))
                : form.watch("primaryIncome.monthlyDay") === undefined
                ? ""
                : String(form.watch("primaryIncome.monthlyDay"))
            }
            onValueChange={(value) =>
              typeof prefix === "number"
                ? form.setValue(
                    `secondaryIncomes.${prefix}.monthlyDay`,
                    value === "" ? undefined : Number(value)
                  )
                : form.setValue(
                    "primaryIncome.monthlyDay",
                    value === "" ? undefined : Number(value)
                  )
            }
          >
            <SelectTrigger id={getField("monthlyDay")}>
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(31)].map((_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </SelectItem>
              ))}
              <SelectItem value="-1">Last day of month</SelectItem>
            </SelectContent>
          </Select>
          {typeof prefix === "number"
            ? form.formState.errors.secondaryIncomes?.[prefix]?.monthlyDay && (
                <p className="text-sm text-destructive">
                  {
                    form.formState.errors.secondaryIncomes[prefix]?.monthlyDay
                      ?.message
                  }
                </p>
              )
            : form.formState.errors.primaryIncome?.monthlyDay && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.primaryIncome.monthlyDay?.message}
                </p>
              )}
        </div>
      );
    }
    if (scheduleType === "one_time") {
      return (
        <div>
          <Label htmlFor={getField("biWeeklyStartDate")}>Pay Date</Label>
          <Input
            type="date"
            {...form.register(getField("biWeeklyStartDate") as any)}
            id={getField("biWeeklyStartDate")}
          />
        </div>
      );
    }
    return null;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Primary Income</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryIncome.name">Name</Label>
            <Input
              id="primaryIncome.name"
              {...form.register("primaryIncome.name")}
              placeholder="e.g., Paycheck"
            />
            {form.formState.errors.primaryIncome?.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.primaryIncome.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryIncome.amount">Amount</Label>
            <Input
              id="primaryIncome.amount"
              type="number"
              step="0.01"
              {...form.register("primaryIncome.amount", {
                valueAsNumber: true,
              })}
            />
            {form.formState.errors.primaryIncome?.amount && (
              <p className="text-sm text-destructive">
                {form.formState.errors.primaryIncome.amount.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryIncome.scheduleType">Schedule Type</Label>
            <Select
              value={form.watch("primaryIncome.scheduleType")}
              onValueChange={(value) =>
                form.setValue("primaryIncome.scheduleType", value as any)
              }
            >
              <SelectTrigger id="primaryIncome.scheduleType">
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semi_monthly">
                  15th + End of Month
                </SelectItem>
                <SelectItem value="bi_weekly">Every 2 Weeks</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="one_time">One-time</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.primaryIncome?.scheduleType && (
              <p className="text-sm text-destructive">
                {form.formState.errors.primaryIncome.scheduleType.message}
              </p>
            )}
          </div>
        </div>
        {renderScheduleFields(
          "primaryIncome",
          form.watch("primaryIncome.scheduleType")
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Secondary Income</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ name: "", amount: 0, scheduleType: "semi_monthly" })
            }
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add Income
          </Button>
        </div>
        {fields.map((field, index) => (
          <Card key={field.id} className="p-4 mb-2">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Income #{index + 1}</h3>
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`secondaryIncomes.${index}.name`}>Name</Label>
                <Input
                  id={`secondaryIncomes.${index}.name`}
                  {...form.register(`secondaryIncomes.${index}.name`)}
                  placeholder="e.g., Freelance"
                />
                {form.formState.errors.secondaryIncomes?.[index]?.name && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors.secondaryIncomes[index]?.name
                        ?.message
                    }
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`secondaryIncomes.${index}.amount`}>
                  Amount
                </Label>
                <Input
                  id={`secondaryIncomes.${index}.amount`}
                  type="number"
                  step="0.01"
                  {...form.register(`secondaryIncomes.${index}.amount`, {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.secondaryIncomes?.[index]?.amount && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors.secondaryIncomes[index]?.amount
                        ?.message
                    }
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`secondaryIncomes.${index}.scheduleType`}>
                  Schedule Type
                </Label>
                <Select
                  value={form.watch(`secondaryIncomes.${index}.scheduleType`)}
                  onValueChange={(value) =>
                    form.setValue(
                      `secondaryIncomes.${index}.scheduleType`,
                      value as any
                    )
                  }
                >
                  <SelectTrigger id={`secondaryIncomes.${index}.scheduleType`}>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semi_monthly">
                      15th + End of Month
                    </SelectItem>
                    <SelectItem value="bi_weekly">Every 2 Weeks</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="one_time">One-time</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.secondaryIncomes?.[index]
                  ?.scheduleType && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors.secondaryIncomes[index]
                        ?.scheduleType?.message
                    }
                  </p>
                )}
              </div>
              {/* Render biWeeklyDay error if present */}
              {form.watch(`secondaryIncomes.${index}.scheduleType`) ===
                "bi_weekly" && (
                <div className="space-y-2">
                  <Label htmlFor={`secondaryIncomes.${index}.biWeeklyDay`}>
                    Day of Week
                  </Label>
                  <Select
                    value={
                      form.watch(`secondaryIncomes.${index}.biWeeklyDay`) || ""
                    }
                    onValueChange={(value) =>
                      form.setValue(
                        `secondaryIncomes.${index}.biWeeklyDay`,
                        value as any
                      )
                    }
                  >
                    <SelectTrigger id={`secondaryIncomes.${index}.biWeeklyDay`}>
                      <SelectValue placeholder="Select day" />
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
                  {form.formState.errors.secondaryIncomes?.[index]
                    ?.biWeeklyDay && (
                    <p className="text-sm text-destructive">
                      {
                        form.formState.errors.secondaryIncomes[index]
                          ?.biWeeklyDay?.message
                      }
                    </p>
                  )}
                </div>
              )}
              {/* Render biWeeklyStartDate error if present */}
              {(form.watch(`secondaryIncomes.${index}.scheduleType`) ===
                "bi_weekly" ||
                form.watch(`secondaryIncomes.${index}.scheduleType`) ===
                  "one_time") && (
                <div className="space-y-2">
                  <Label
                    htmlFor={`secondaryIncomes.${index}.biWeeklyStartDate`}
                  >
                    {form.watch(`secondaryIncomes.${index}.scheduleType`) ===
                    "bi_weekly"
                      ? "First Pay Date"
                      : "Pay Date"}
                  </Label>
                  <Input
                    type="date"
                    {...form.register(
                      `secondaryIncomes.${index}.biWeeklyStartDate` as any
                    )}
                    id={`secondaryIncomes.${index}.biWeeklyStartDate`}
                  />
                  {form.formState.errors.secondaryIncomes?.[index]
                    ?.biWeeklyStartDate && (
                    <p className="text-sm text-destructive">
                      {
                        form.formState.errors.secondaryIncomes[index]
                          ?.biWeeklyStartDate?.message
                      }
                    </p>
                  )}
                </div>
              )}
              {/* Render monthlyDay error if present */}
              {form.watch(`secondaryIncomes.${index}.scheduleType`) ===
                "monthly" && (
                <div className="space-y-2">
                  <Label htmlFor={`secondaryIncomes.${index}.monthlyDay`}>
                    Day of Month
                  </Label>
                  <Select
                    value={
                      form.watch(`secondaryIncomes.${index}.monthlyDay`) ===
                      undefined
                        ? ""
                        : String(
                            form.watch(`secondaryIncomes.${index}.monthlyDay`)
                          )
                    }
                    onValueChange={(value) =>
                      form.setValue(
                        `secondaryIncomes.${index}.monthlyDay`,
                        value === "" ? undefined : Number(value)
                      )
                    }
                  >
                    <SelectTrigger id={`secondaryIncomes.${index}.monthlyDay`}>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(31)].map((_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1}
                        </SelectItem>
                      ))}
                      <SelectItem value="-1">Last day of month</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.secondaryIncomes?.[index]
                    ?.monthlyDay && (
                    <p className="text-sm text-destructive">
                      {
                        form.formState.errors.secondaryIncomes[index]
                          ?.monthlyDay?.message
                      }
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </form>
  );
});

export { StepIncome };
