// src/app/(dashboard)/budget-setup/components/step-fixed-expenses.tsx
"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
  useCallback,
  useRef,
  lazy,
  Suspense,
} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useBudgetSetup, FixedExpense } from "../budget-setup-context";
import { ExpenseSourceSummaryCard } from "./expense-source-summary-card";
import { useUser } from "@/hooks/use-user";
import { Tables } from "@/types/supabase";
import {
  FrequencyType,
  FrequencyConfig,
  jsonToFrequencyConfig,
  frequencyConfigToJson,
} from "@/types/frequency";
import { useVirtualizer } from "@tanstack/react-virtual";

const FixedExpenseForm = lazy(() =>
  import("./fixed-expense-form").then((module) => ({
    default: module.FixedExpenseForm,
  }))
);

type FixedExpenseType = Tables<"fixed_expenses">;

interface FixedExpenseFormState {
  expenses: FixedExpenseType[];
  editingExpense: string | null;
  addingNewExpense: boolean;
  loading: boolean;
  saving: boolean;
}

interface StepFixedExpensesProps {
  householdId: string;
  onComplete: () => void;
}

const mapToFixedExpense = (dbExpense: FixedExpenseType): FixedExpense => {
  // This function can receive objects from the database (FixedExpenseType)
  // or from the application's context (FixedExpense). We cast to `any`
  // to handle both shapes gracefully and avoid type errors.
  const expense = dbExpense as any;

  const amount = expense.estimated_amount ?? expense.amount ?? 0;
  const isVariable = expense.is_variable ?? expense.isVariable ?? false;

  return {
    id: expense.id,
    name: expense.name || "",
    category: expense.category || "",
    amount: Number(amount) || 0,
    isVariable: isVariable,
    notes: expense.notes || undefined,
    frequency_type: expense.frequency_type as FrequencyType | null,
    frequency_config: jsonToFrequencyConfig(expense.frequency_config),
    anchor_date: expense.anchor_date,
    next_due_date: expense.next_due_date,
  };
};

const StepFixedExpenses = forwardRef(function StepFixedExpenses(
  { householdId, onComplete }: StepFixedExpensesProps,
  ref
) {
  const { getStepData, setStepData } = useBudgetSetup();
  const {
    householdId: userHouseholdId,
    loading: userLoading,
    error: userError,
  } = useUser();

  // Split state into multiple hooks for more granular updates
  const [expenses, setExpenses] = useState<FixedExpenseType[]>(
    () => getStepData("fixedExpenses")?.expenses || []
  );
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [addingNewExpense, setAddingNewExpense] = useState(
    () => !getStepData("fixedExpenses")?.expenses?.length
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasAttemptedLoad = useRef(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: expenses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Adjusted for better spacing
    overscan: 5,
  });
  // IMPORTANT: All hooks must be called before any early returns!
  // Memoize the update function to prevent unnecessary re-renders
  const updateStepData = useCallback(
    (newExpenses: FixedExpenseType[]) => {
      setStepData("fixedExpenses", {
        expenses: newExpenses.map(mapToFixedExpense),
      });
    },
    [setStepData]
  );

  // Load existing data if not in state
  useEffect(() => {
    const loadFixedExpenses = async () => {
      // Exit early if we don't have household ID or already attempted load
      if (!userHouseholdId || hasAttemptedLoad.current) {
        return;
      }

      // Check if we already have data in state
      if (expenses.length > 0) {
        hasAttemptedLoad.current = true;
        return;
      }

      // Check context for data first
      const existingData = getStepData("fixedExpenses");
      if (existingData?.expenses && existingData.expenses.length > 0) {
        setExpenses(existingData.expenses);
        setAddingNewExpense(false);
        hasAttemptedLoad.current = true;
        return;
      }

      try {
        hasAttemptedLoad.current = true;
        setLoading(true);

        const response = await fetch(
          `/api/budget-setup/fixed-expenses?householdId=${userHouseholdId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load fixed expenses");
        }

        const { expenses: loadedExpenses } = await response.json();

        // Update both state and context
        setExpenses(loadedExpenses || []);
        setLoading(false);
        setAddingNewExpense(!loadedExpenses?.length);

        // Only update context if we have new data
        if (loadedExpenses && loadedExpenses.length > 0) {
          updateStepData(loadedExpenses);
        }
      } catch (error) {
        console.error("Error loading fixed expenses:", error);
        toast.error("Failed to load fixed expenses");
        setLoading(false);
      }
    };

    loadFixedExpenses();
  }, [userHouseholdId, updateStepData, getStepData, expenses.length]);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (expenses.length === 0) {
        toast.error("Please add at least one fixed expense before continuing");
        return;
      }
      onComplete();
    },
  }));

  // NOW we can have early returns - all hooks have been called above

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Show error state if authentication failed
  if (userError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-500">
        <p>Authentication error: {userError}</p>
        <Button
          className="mt-4"
          onClick={() => (window.location.href = "/auth/signin")}
        >
          Sign In
        </Button>
      </div>
    );
  }

  // Show error if no household ID
  if (!userHouseholdId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-500">
        <p>No household found. Please create or join a household first.</p>
      </div>
    );
  }

  const handleAddExpense = () => {
    setAddingNewExpense(true);
    setEditingExpense(null);
  };

  const handleEditExpense = (expense: FixedExpenseType) => {
    setEditingExpense(expense.id);
    setAddingNewExpense(false);
  };

  const handleDeleteExpense = useCallback(
    async (expenseId: string) => {
      try {
        const response = await fetch(
          `/api/budget-setup/fixed-expenses?householdId=${userHouseholdId}&id=${expenseId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete expense");
        }

        const updatedExpenses = expenses.filter(
          (expense) => expense.id !== expenseId
        );
        setExpenses(updatedExpenses);
        updateStepData(updatedExpenses);
        toast.success("Expense deleted successfully");
      } catch (error) {
        console.error("Error deleting expense:", error);
        toast.error("Failed to delete expense");
      }
    },
    [userHouseholdId, expenses, updateStepData]
  );

  const handleSaveExpense = useCallback(
    async (formData: any) => {
      setSaving(true);
      const isEditing = !!editingExpense;

      try {
        const payload = {
          householdId,
          expenses: [formData],
        };

        const response = await fetch(`/api/budget-setup/fixed-expenses`, {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save expense");
        }

        const savedExpense = await response.json();

        let updatedExpenses;
        if (isEditing) {
          updatedExpenses = expenses.map((exp) =>
            exp.id === savedExpense.id ? savedExpense : exp
          );
        } else {
          updatedExpenses = [...expenses, savedExpense];
        }

        setExpenses(updatedExpenses);
        setEditingExpense(null);
        setAddingNewExpense(false);
        setSaving(false);

        updateStepData(updatedExpenses);
        toast.success(
          `Expense ${isEditing ? "updated" : "added"} successfully`
        );
      } catch (error) {
        console.error("Error saving expense:", error);
        toast.error(
          error instanceof Error ? error.message : "An error occurred"
        );
        setSaving(false);
      }
    },
    [userHouseholdId, expenses, editingExpense, updateStepData]
  );

  const handleCancelForm = () => {
    setEditingExpense(null);
    setAddingNewExpense(false);
  };

  const currentExpense = editingExpense
    ? expenses.find((exp) => exp.id === editingExpense)
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Fixed Expenses</h3>
        {!addingNewExpense && !editingExpense && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddExpense}
            disabled={saving}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        )}
      </div>

      {loading && expenses.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : null}

      {!loading && expenses.length === 0 && !addingNewExpense && (
        <Card className="p-6 text-center text-gray-500">
          <p>No fixed expenses added yet.</p>
          <Button className="mt-4" size="sm" onClick={handleAddExpense}>
            Add First Expense
          </Button>
        </Card>
      )}

      {expenses.length > 0 && (
        <div
          ref={parentRef}
          className="h-[450px] overflow-y-auto rounded-lg border bg-gray-50/50 p-2 space-y-2"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const expense = expenses[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <ExpenseSourceSummaryCard
                    expense={mapToFixedExpense(expense)}
                    onEdit={() => handleEditExpense(expense)}
                    onDelete={() => handleDeleteExpense(expense.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(addingNewExpense || editingExpense) && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          <FixedExpenseForm
            expense={currentExpense}
            onSave={handleSaveExpense}
            onCancel={handleCancelForm}
            saving={saving}
          />
        </Suspense>
      )}
    </div>
  );
});

StepFixedExpenses.displayName = "StepFixedExpenses";

export { StepFixedExpenses };
