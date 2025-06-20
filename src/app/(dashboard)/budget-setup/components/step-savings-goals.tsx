"use client";

import React, { forwardRef, useImperativeHandle, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBudgetSetup, SavingsGoal } from "../budget-setup-context";
import { Checkbox } from "@/components/ui/checkbox";
import { SavingsGoalSummaryCard } from "./savings-goal-summary-card";

const singleSavingsGoalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.number().min(0, "Target amount must be positive"),
  currentAmount: z.number().min(0, "Current amount must be positive"),
  defaultContribution: z
    .number()
    .min(0, "Default contribution must be positive"),
  isEmergencyFund: z.boolean(),
  isRoundupTarget: z.boolean(),
  targetDate: z.string().optional(),
});

type SavingsGoalFormData = z.infer<typeof singleSavingsGoalSchema>;

interface StepSavingsGoalsProps {
  householdId: string;
  onComplete: () => void;
}

const StepSavingsGoals = forwardRef(function StepSavingsGoals(
  { householdId, onComplete }: StepSavingsGoalsProps,
  ref
) {
  const { getStepData, addSavingsGoal, updateSavingsGoal, removeSavingsGoal } =
    useBudgetSetup();
  const existingData = getStepData("savingsGoals");
  const goals = existingData?.goals || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const form = useForm<SavingsGoalFormData>({
    resolver: zodResolver(singleSavingsGoalSchema),
  });

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    form.reset(goal);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    removeSavingsGoal(id);
    toast.success("Savings goal removed");
  };

  const handleAddNew = () => {
    setEditingGoal(null);
    form.reset({
      name: "",
      targetAmount: 0,
      currentAmount: 0,
      defaultContribution: 0,
      isEmergencyFund: false,
      isRoundupTarget: false,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: SavingsGoalFormData) => {
    if (editingGoal) {
      updateSavingsGoal(editingGoal.id, data);
      toast.success("Savings goal updated");
    } else {
      addSavingsGoal(data);
      toast.success("Savings goal added");
    }
    setIsDialogOpen(false);
    setEditingGoal(null);
  };

  useImperativeHandle(ref, () => ({
    submit: () => {
      // Since we save on each action, we can just call onComplete
      onComplete();
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Savings Goals</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddNew}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => (
          <SavingsGoalSummaryCard
            key={goal.id}
            goal={goal}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Edit Savings Goal" : "Add New Savings Goal"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="e.g., Emergency Fund"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  {...form.register("targetAmount", { valueAsNumber: true })}
                />
                {form.formState.errors.targetAmount && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.targetAmount.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentAmount">Current Amount</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  {...form.register("currentAmount", { valueAsNumber: true })}
                />
                {form.formState.errors.currentAmount && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.currentAmount.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultContribution">
                  Default Contribution
                </Label>
                <Input
                  id="defaultContribution"
                  type="number"
                  step="0.01"
                  {...form.register("defaultContribution", {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.defaultContribution && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.defaultContribution.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isEmergencyFund"
                {...form.register("isEmergencyFund")}
              />
              <Label htmlFor="isEmergencyFund">
                Is this an emergency fund?
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRoundupTarget"
                {...form.register("isRoundupTarget")}
              />
              <Label htmlFor="isRoundupTarget">Use for round-ups?</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingGoal ? "Save Changes" : "Add Goal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export { StepSavingsGoals };
