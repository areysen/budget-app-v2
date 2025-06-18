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
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useBudgetSetup,
  BudgetFixedExpensesStep,
} from "../budget-setup-context";
import { supabase } from "@/lib/supabase/client";

const fixedExpenseSchema = z.object({
  expenses: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        category: z.string().min(1, "Category is required"),
        amount: z.number().min(0, "Amount must be positive"),
        dueDay: z.number().min(1).max(31),
        isVariable: z.boolean(),
        frequency: z.enum(["monthly", "quarterly", "annual"]),
      })
    )
    .min(1, "At least one fixed expense is required"),
});

type FixedExpenseFormData = z.infer<typeof fixedExpenseSchema>;

interface StepFixedExpensesProps {
  householdId: string;
  onComplete: () => void;
}

const EXPENSE_CATEGORIES = [
  "Rent/Mortgage",
  "Utilities",
  "Insurance",
  "Subscriptions",
  "Loans",
  "Other",
] as const;

const EXAMPLE_EXPENSES = [
  {
    name: "Rent",
    category: "Rent/Mortgage",
    amount: 0,
    dueDay: 1,
    isVariable: false,
    frequency: "monthly" as const,
  },
  {
    name: "Electric",
    category: "Utilities",
    amount: 190,
    dueDay: 15,
    isVariable: true,
    frequency: "monthly" as const,
  },
  {
    name: "Gas",
    category: "Utilities",
    amount: 60,
    dueDay: 15,
    isVariable: true,
    frequency: "monthly" as const,
  },
];

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

const StepFixedExpenses = forwardRef(function StepFixedExpenses(
  { householdId, onComplete }: StepFixedExpensesProps,
  ref
) {
  const { getStepData, setStepData } = useBudgetSetup();
  const existingData = getStepData("fixedExpenses");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const form = useForm<FixedExpenseFormData>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: existingData || {
      expenses: [
        {
          name: "",
          category: "",
          amount: 0,
          dueDay: 1,
          isVariable: false,
          frequency: "monthly",
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
      setIsSubmitting(true);
      // Ensure all custom categories exist
      for (const expense of data.expenses) {
        if (expense.category && expense.category !== "custom") {
          await ensureCategoryExists(expense.category, householdId);
        }
      }
      // Save to context
      setStepData("fixedExpenses", data);
      // Save to API
      const response = await fetch("/api/budget-setup/fixed-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to save fixed expenses");
      }
      onComplete();
    } catch (error) {
      toast.error("Failed to save fixed expenses. Please try again.");
      console.error("Error saving fixed expenses:", error);
    } finally {
      setIsSubmitting(false);
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
        dueDay: 1,
        isVariable: false,
        frequency: "monthly",
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
                  {...form.register(`expenses.${index}.amount`)}
                  placeholder="e.g., 1000"
                />
                {form.formState.errors.expenses?.[index]?.amount && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.expenses[index]?.amount?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`expenses.${index}.dueDay`}>Due Day</Label>
                <Input
                  id={`expenses.${index}.dueDay`}
                  {...form.register(`expenses.${index}.dueDay`)}
                  placeholder="e.g., 15"
                />
                {form.formState.errors.expenses?.[index]?.dueDay && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.expenses[index]?.dueDay?.message}
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
                <Label htmlFor={`expenses.${index}.frequency`}>Frequency</Label>
                <Select
                  value={form.watch(`expenses.${index}.frequency`)}
                  onValueChange={(value) =>
                    form.setValue(`expenses.${index}.frequency`, value as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.expenses?.[index]?.frequency && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.expenses[index]?.frequency?.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </form>
  );
});

export { StepFixedExpenses };
