"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Target, DollarSign, Calendar } from "lucide-react";
import { toast } from "react-hot-toast";

// Form schema that matches the database schema - make all fields consistent
const formSchema = z.object({
  name: z.string().min(1, "Goal name is required"),
  description: z.string().optional(),
  target_amount: z.number().min(1, "Target amount must be greater than 0"),
  target_date: z.string().optional(),
  current_balance: z.number().min(0, "Current balance must be positive"),
  is_emergency_fund: z.boolean(),
  is_roundup_target: z.boolean(),
  sort_order: z.number(),
});

type FormSchema = z.infer<typeof formSchema>;

interface SavingsGoalFormProps {
  goal?: {
    id?: string;
    name: string;
    description?: string;
    target_amount: number;
    target_date?: string;
    current_balance: number;
    is_emergency_fund: boolean;
    is_roundup_target: boolean;
    sort_order: number;
  };
  onSave: (data: FormSchema) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const SUGGESTED_GOALS = [
  {
    name: "Emergency Fund",
    description: "Essential safety net (recommended minimum)",
    target_amount: 1000,
    current_balance: 0,
    is_emergency_fund: true,
    is_roundup_target: false,
    sort_order: 0,
  },
  {
    name: "Vacation Fund",
    description: "Annual vacation savings",
    target_amount: 2000,
    current_balance: 0,
    is_emergency_fund: false,
    is_roundup_target: false,
    sort_order: 1,
  },
  {
    name: "Car Replacement",
    description: "Future vehicle down payment",
    target_amount: 5000,
    current_balance: 0,
    is_emergency_fund: false,
    is_roundup_target: false,
    sort_order: 2,
  },
  {
    name: "Home Down Payment",
    description: "Future home purchase",
    target_amount: 20000,
    current_balance: 0,
    is_emergency_fund: false,
    is_roundup_target: false,
    sort_order: 3,
  },
];

export function SavingsGoalForm({
  goal,
  onSave,
  onCancel,
  saving = false,
}: SavingsGoalFormProps) {
  const isEditing = !!goal;

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: goal?.name || "",
      description: goal?.description || "",
      target_amount: goal?.target_amount || 0,
      target_date: goal?.target_date || "",
      current_balance: goal?.current_balance || 0,
      is_emergency_fund: goal?.is_emergency_fund || false,
      is_roundup_target: goal?.is_roundup_target || false,
      sort_order: goal?.sort_order || 0,
    },
  });

  const onSubmit: SubmitHandler<FormSchema> = async (data: FormSchema) => {
    try {
      await onSave(data);
      if (!isEditing) {
        form.reset();
      }
    } catch (error) {
      console.error("Error saving savings goal:", error);
      toast.error("Failed to save savings goal. Please try again.");
    }
  };

  const applySuggestedGoal = (suggested: (typeof SUGGESTED_GOALS)[0]) => {
    form.setValue("name", suggested.name);
    form.setValue("description", suggested.description);
    form.setValue("target_amount", suggested.target_amount);
    form.setValue("current_balance", suggested.current_balance);
    form.setValue("is_emergency_fund", suggested.is_emergency_fund);
    form.setValue("is_roundup_target", suggested.is_roundup_target);
    form.setValue("sort_order", suggested.sort_order);

    // Clear target date when applying suggestions
    form.setValue("target_date", "");
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            {isEditing ? "Edit Savings Goal" : "Add Savings Goal"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Update your savings goal details"
              : "Create a new savings goal to track your progress"}
          </p>
        </div>

        {!isEditing && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Setup</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SUGGESTED_GOALS.map((suggested) => (
                <Button
                  key={suggested.name}
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => applySuggestedGoal(suggested)}
                  className="h-auto p-3 text-left justify-start"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{suggested.name}</div>
                    <div className="text-xs text-muted-foreground">
                      ${suggested.target_amount.toLocaleString()}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            <div className="border-t pt-4" />
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                placeholder="e.g., Emergency Fund"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_amount">Target Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="target_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-10"
                  {...form.register("target_amount", { valueAsNumber: true })}
                />
              </div>
              {form.formState.errors.target_amount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.target_amount.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this goal..."
              rows={2}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="target_date">Target Date (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="target_date"
                  type="date"
                  className="pl-10"
                  {...form.register("target_date")}
                />
              </div>
              {form.formState.errors.target_date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.target_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_balance">Current Balance</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="current_balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-10"
                  {...form.register("current_balance", { valueAsNumber: true })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                How much you currently have saved toward this goal
              </p>
              {form.formState.errors.current_balance && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.current_balance.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_emergency_fund"
                checked={form.watch("is_emergency_fund")}
                onCheckedChange={(checked) =>
                  form.setValue("is_emergency_fund", checked as boolean)
                }
              />
              <Label
                htmlFor="is_emergency_fund"
                className="text-sm font-medium"
              >
                This is an emergency fund
              </Label>
            </div>
            <div className="flex items-center space-x-2 ml-6">
              <Checkbox
                id="is_roundup_target"
                checked={form.watch("is_roundup_target")}
                onCheckedChange={(checked) =>
                  form.setValue("is_roundup_target", checked as boolean)
                }
              />
              <Label
                htmlFor="is_roundup_target"
                className="text-sm font-medium"
              >
                Use for transaction roundups
              </Label>
            </div>
            <div className="text-xs text-muted-foreground ml-6 space-y-1">
              <p>• Emergency funds get priority in budget allocation</p>
              <p>• Roundup targets receive spare change from transactions</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Goal" : "Add Goal"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
