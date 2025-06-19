"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
  useCallback,
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

const mapToFixedExpense = (dbExpense: FixedExpenseType): FixedExpense => ({
  id: dbExpense.id,
  name: dbExpense.name || "",
  category: dbExpense.category || "",
  amount: dbExpense.estimated_amount,
  isVariable: dbExpense.is_variable || false,
  notes: dbExpense.notes || undefined,
  frequency_type: dbExpense.frequency_type as FrequencyType | null,
  frequency_config: jsonToFrequencyConfig(dbExpense.frequency_config),
  anchor_date: dbExpense.anchor_date,
  next_due_date: dbExpense.next_due_date,
});

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
      if (state.loading || state.expenses.length > 0) {
        return;
      }

      // Check context for data
      const existingData = getStepData("fixedExpenses");
      if (existingData?.expenses && existingData.expenses.length > 0) {
        setState((prev) => ({
          ...prev,
          expenses: existingData.expenses,
          addingNewExpense: false,
        }));
        return;
      }

      try {
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
  }, [userHouseholdId, updateStepData]);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (state.expenses.length === 0) {
        toast.error("Please add at least one fixed expense before continuing");
        return;
      }
      onComplete();
    },
  }));

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

  const handleDeleteExpense = async (expenseId: string) => {
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
  };

  const handleSaveExpense = async (formData: any) => {
    try {
      setState((prev) => ({ ...prev, saving: true }));

      const payload = {
        ...formData,
        household_id: userHouseholdId,
        estimated_amount: formData.amount,
        is_variable: formData.isVariable,
        frequency_config: frequencyConfigToJson(formData.frequency_config),
      };

      let response;
      if (state.editingExpense) {
        // Update existing expense
        response = await fetch(
          `/api/budget-setup/fixed-expenses?householdId=${userHouseholdId}&id=${state.editingExpense}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        // Create new expense
        response = await fetch(
          `/api/budget-setup/fixed-expenses?householdId=${userHouseholdId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!response.ok) {
        throw new Error("Failed to save expense");
      }

      const savedExpense = await response.json();

      // Update state and context
      const updatedExpenses = state.editingExpense
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
        `Expense ${state.editingExpense ? "updated" : "added"} successfully`
      );
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense");
      setState((prev) => ({ ...prev, saving: false }));
    }
  };

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        {state.expenses.map((expense) => (
          <ExpenseSourceSummaryCard
            key={expense.id}
            expense={mapToFixedExpense(expense)}
            onEdit={() => handleEditExpense(expense)}
            onDelete={() => handleDeleteExpense(expense.id)}
          />
        ))}
      </div>

      {(state.addingNewExpense || state.editingExpense) && (
        <Card className="p-6">
          <FixedExpenseForm
            expense={currentExpense}
            onSave={handleSaveExpense}
            onCancel={handleCancelForm}
            saving={state.saving}
          />
        </Card>
      )}

      {!state.addingNewExpense && !state.editingExpense && (
        <Button onClick={handleAddExpense} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Fixed Expense
        </Button>
      )}
    </div>
  );
});

StepFixedExpenses.displayName = "StepFixedExpenses";

export { StepFixedExpenses };
