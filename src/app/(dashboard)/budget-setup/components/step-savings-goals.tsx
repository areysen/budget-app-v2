"use client";

import React, { forwardRef, useImperativeHandle } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import {
  useBudgetSetup,
  BudgetSavingsGoalsStep,
} from "../budget-setup-context";
import { Checkbox } from "@/components/ui/checkbox";

const savingsGoalSchema = z.object({
  goals: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        targetAmount: z.number().min(0, "Target amount must be positive"),
        currentAmount: z.number().min(0, "Current amount must be positive"),
        defaultContribution: z
          .number()
          .min(0, "Default contribution must be positive"),
        isEmergencyFund: z.boolean(),
        isRoundupTarget: z.boolean(),
      })
    )
    .min(1, "At least one savings goal is required"),
});

type SavingsGoalFormData = z.infer<typeof savingsGoalSchema>;

interface StepSavingsGoalsProps {
  householdId: string;
  onComplete: () => void;
}

const StepSavingsGoals = forwardRef(function StepSavingsGoals(
  { householdId, onComplete }: StepSavingsGoalsProps,
  ref
) {
  const { getStepData, setStepData } = useBudgetSetup();
  const existingData = getStepData("savingsGoals");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SavingsGoalFormData>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: existingData || {
      goals: [
        {
          name: "",
          targetAmount: 0,
          currentAmount: 0,
          defaultContribution: 0,
          isEmergencyFund: false,
          isRoundupTarget: false,
        },
      ],
    },
  });

  const onSubmit = async (data: SavingsGoalFormData) => {
    try {
      setIsSubmitting(true);
      // Save to context
      setStepData("savingsGoals", data);

      // Save to API
      const response = await fetch("/api/budget-setup/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save savings goals");
      }

      onComplete();
    } catch (error) {
      toast.error("Failed to save savings goals. Please try again.");
      console.error("Error saving savings goals:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addGoal = () => {
    const currentGoals = form.getValues("goals");
    form.setValue("goals", [
      ...currentGoals,
      {
        name: "",
        targetAmount: 0,
        currentAmount: 0,
        defaultContribution: 0,
        isEmergencyFund: false,
        isRoundupTarget: false,
      },
    ]);
  };

  const removeGoal = (index: number) => {
    const currentGoals = form.getValues("goals");
    form.setValue(
      "goals",
      currentGoals.filter((_, i) => i !== index)
    );
  };

  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(onSubmit)(),
  }));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Savings Goals</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addGoal}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Goal
          </Button>
        </div>

        {form.watch("goals").map((_, index) => (
          <div key={index} className="grid gap-4 p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Goal #{index + 1}</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeGoal(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`goals.${index}.name`}>Name</Label>
                <Input
                  id={`goals.${index}.name`}
                  {...form.register(`goals.${index}.name`)}
                  placeholder="e.g., Emergency Fund"
                />
                {form.formState.errors.goals?.[index]?.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.goals[index]?.name?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`goals.${index}.targetAmount`}>
                  Target Amount
                </Label>
                <Input
                  id={`goals.${index}.targetAmount`}
                  type="number"
                  step="0.01"
                  {...form.register(`goals.${index}.targetAmount`, {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.goals?.[index]?.targetAmount && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.goals[index]?.targetAmount?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`goals.${index}.currentAmount`}>
                  Current Amount
                </Label>
                <Input
                  id={`goals.${index}.currentAmount`}
                  type="number"
                  step="0.01"
                  {...form.register(`goals.${index}.currentAmount`, {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.goals?.[index]?.currentAmount && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.goals[index]?.currentAmount?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`goals.${index}.defaultContribution`}>
                  Default Contribution
                </Label>
                <Input
                  id={`goals.${index}.defaultContribution`}
                  type="number"
                  step="0.01"
                  {...form.register(`goals.${index}.defaultContribution`, {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.goals?.[index]?.defaultContribution && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors.goals[index]?.defaultContribution
                        ?.message
                    }
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`goals.${index}.isEmergencyFund`}
                    checked={form.watch(`goals.${index}.isEmergencyFund`)}
                    onCheckedChange={(checked) =>
                      form.setValue(
                        `goals.${index}.isEmergencyFund`,
                        checked as boolean
                      )
                    }
                  />
                  <Label htmlFor={`goals.${index}.isEmergencyFund`}>
                    Emergency Fund
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`goals.${index}.isRoundupTarget`}
                    checked={form.watch(`goals.${index}.isRoundupTarget`)}
                    onCheckedChange={(checked) =>
                      form.setValue(
                        `goals.${index}.isRoundupTarget`,
                        checked as boolean
                      )
                    }
                  />
                  <Label htmlFor={`goals.${index}.isRoundupTarget`}>
                    Roundup Target
                  </Label>
                </div>
              </div>
            </div>
          </div>
        ))}

        {form.formState.errors.goals &&
          !Array.isArray(form.formState.errors.goals) && (
            <p className="text-sm text-destructive">
              {form.formState.errors.goals.message}
            </p>
          )}
      </div>
    </form>
  );
});

export { StepSavingsGoals };
