// src/app/(dashboard)/budget-setup/components/step-fixed-expenses.tsx
"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useBudgetSetup, FixedExpense } from "../budget-setup-context";
import { ExpenseSourceSummaryCard } from "./expense-source-summary-card";
import { FixedExpenseForm } from "./fixed-expense-form";
import { useUser } from "@/hooks/use-user";
import { Tables } from "@/types/supabase";
import {
  FrequencyType,
  FrequencyConfig,
  jsonToFrequencyConfig,
  frequencyConfigToJson,
} from "@/types/frequency";
import { useVirtualizer } from "@tanstack/react-virtual";

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

  // Initialize state with data from context
  const [state, setState] = useState<FixedExpenseFormState>(() => {
    const existingData = getStepData("fixedExpenses");
    return {
      expenses: existingData?.expenses || [],
      editingExpense: null,
      addingNewExpense: !existingData?.expenses?.length,
      loading: false,
      saving: false,
    };
  });
  const hasAttemptedLoad = useRef(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: state.expenses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Adjusted for better spacing
    overscan: 5,
  });
  // IMPORTANT: All hooks must be called before any early returns!
  // Memoize the update function to prevent unnecessary re-renders
  const updateStepData = useCallback(
    (expenses: FixedExpenseType[]) => {
      setStepData("fixedExpenses", {
        expenses: expenses.map(mapToFixedExpense),
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
      if (state.expenses.length > 0) {
        hasAttemptedLoad.current = true;
        return;
      }

      // Check context for data first
      const existingData = getStepData("fixedExpenses");
      if (existingData?.expenses && existingData.expenses.length > 0) {
        setState((prev) => ({
          ...prev,
          expenses: existingData.expenses,
          addingNewExpense: false,
        }));
        hasAttemptedLoad.current = true;
        return;
      }

      try {
        hasAttemptedLoad.current = true;
        setState((prev) => ({ ...prev, loading: true }));

        const response = await fetch(
          `/api/budget-setup/fixed-expenses?householdId=${userHouseholdId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load fixed expenses");
        }

        const { expenses } = await response.json();

        // Update both state and context
        setState((prev) => ({
          ...prev,
          expenses: expenses || [],
          loading: false,
          addingNewExpense: !expenses?.length,
        }));

        // Only update context if we have new data
        if (expenses && expenses.length > 0) {
          updateStepData(expenses);
        }
      } catch (error) {
        console.error("Error loading fixed expenses:", error);
        toast.error("Failed to load fixed expenses");
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    loadFixedExpenses();
  }, [userHouseholdId, updateStepData, getStepData]); // Clean dependency array

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (state.expenses.length === 0) {
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
    setState((prev) => ({
      ...prev,
      addingNewExpense: true,
      editingExpense: null,
    }));
  };

  const handleEditExpense = (expense: FixedExpenseType) => {
    setState((prev) => ({
      ...prev,
      editingExpense: expense.id,
      addingNewExpense: false,
    }));
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

        const updatedExpenses = state.expenses.filter(
          (expense) => expense.id !== expenseId
        );
        setState((prev) => ({
          ...prev,
          expenses: updatedExpenses,
        }));
        updateStepData(updatedExpenses);
        toast.success("Expense deleted successfully");
      } catch (error) {
        console.error("Error deleting expense:", error);
        toast.error("Failed to delete expense");
      }
    },
    [userHouseholdId, state.expenses, updateStepData]
  );

  const handleSaveExpense = useCallback(
    async (formData: any) => {
      setState((prev) => ({ ...prev, saving: true }));

      try {
        const isEditing = !!state.editingExpense;
        const expenseData = { ...formData, id: state.editingExpense };
        delete expenseData.householdId;

        const payload = {
          householdId,
          expenses: [expenseData],
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

        const updatedExpenses = isEditing
          ? state.expenses.map((expense) =>
              expense.id === state.editingExpense ? savedExpense : expense
            )
          : [...state.expenses, savedExpense];

        setState((prev) => ({
          ...prev,
          expenses: updatedExpenses,
          editingExpense: null,
          addingNewExpense: false,
          saving: false,
        }));

        updateStepData(updatedExpenses);
        toast.success(
          `Expense ${isEditing ? "updated" : "added"} successfully`
        );
      } catch (error) {
        console.error("Error saving expense:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to save expense"
        );
        setState((prev) => ({ ...prev, saving: false }));
      }
    },
    [householdId, state.editingExpense, state.expenses, updateStepData]
  );

  const handleCancelForm = () => {
    setState((prev) => ({
      ...prev,
      editingExpense: null,
      addingNewExpense: false,
    }));
  };

  const currentExpense = state.editingExpense
    ? state.expenses.find((expense) => expense.id === state.editingExpense)
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Fixed Expenses</h3>
        {!state.addingNewExpense && !state.editingExpense && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddExpense}
            disabled={state.saving}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        )}
      </div>

      {state.loading && state.expenses.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : null}

      {!state.loading &&
        state.expenses.length === 0 &&
        !state.addingNewExpense && (
          <Card className="p-6 text-center text-gray-500">
            <p>No fixed expenses added yet.</p>
            <Button className="mt-4" size="sm" onClick={handleAddExpense}>
              Add First Expense
            </Button>
          </Card>
        )}

      {state.expenses.length > 0 && (
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
              const expense = state.expenses[virtualItem.index];
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

      {(state.addingNewExpense || state.editingExpense) && (
        <FixedExpenseForm
          expense={currentExpense}
          onSave={handleSaveExpense}
          onCancel={handleCancelForm}
          saving={state.saving}
        />
      )}
    </div>
  );
});

StepFixedExpenses.displayName = "StepFixedExpenses";

export { StepFixedExpenses };
