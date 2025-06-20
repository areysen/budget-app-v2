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

type DbFixedExpense = Tables<"fixed_expenses">;

interface FixedExpenseState {
  expenses: DbFixedExpense[];
  editingExpense: string | null;
  addingNewExpense: boolean;
  loading: boolean;
  saving: boolean;
}

interface StepFixedExpensesProps {
  householdId: string;
  onComplete: () => void;
}

// DB -> Context
const mapDbExpenseToContext = (dbExpense: DbFixedExpense): FixedExpense => {
  return {
    id: dbExpense.id,
    name: dbExpense.name || "",
    category: dbExpense.category || "",
    amount: dbExpense.estimated_amount,
    isVariable: dbExpense.is_variable ?? false,
    notes: dbExpense.notes || undefined,
    frequency_type: dbExpense.frequency_type as FrequencyType | null,
    frequency_config: jsonToFrequencyConfig(dbExpense.frequency_config),
    anchor_date: dbExpense.anchor_date,
    next_due_date: dbExpense.next_due_date,
  };
};

// Context -> DB
const mapContextExpenseToDb = (
  contextExpense: FixedExpense,
  householdId: string
): DbFixedExpense => {
  return {
    id: contextExpense.id || crypto.randomUUID(),
    household_id: householdId,
    name: contextExpense.name,
    category: contextExpense.category,
    estimated_amount: contextExpense.amount,
    is_variable: contextExpense.isVariable,
    notes: contextExpense.notes || null,
    frequency_type: contextExpense.frequency_type,
    frequency_config: frequencyConfigToJson(contextExpense.frequency_config),
    anchor_date: contextExpense.anchor_date,
    next_due_date: contextExpense.next_due_date,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
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

  const [state, setState] = useState<FixedExpenseState>(() => {
    const existingData = getStepData("fixedExpenses");
    return {
      expenses:
        existingData?.expenses.map((exp: FixedExpense) =>
          mapContextExpenseToDb(exp, householdId)
        ) || [],
      editingExpense: null,
      addingNewExpense: !existingData?.expenses?.length,
      loading: !existingData?.expenses?.length,
      saving: false,
    };
  });

  const hasAttemptedLoad = useRef(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: state.expenses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 130, // Adjusted for padding
    overscan: 5,
  });

  const updateStepData = useCallback(
    (newExpenses: DbFixedExpense[]) => {
      setStepData("fixedExpenses", {
        expenses: newExpenses.map(mapDbExpenseToContext),
      });
    },
    [setStepData]
  );

  useEffect(() => {
    const loadFixedExpenses = async () => {
      if (!userHouseholdId || hasAttemptedLoad.current) {
        return;
      }

      const existingContextData = getStepData("fixedExpenses");
      if (existingContextData?.expenses?.length) {
        setState((prev) => ({
          ...prev,
          expenses: existingContextData.expenses.map((e: FixedExpense) =>
            mapContextExpenseToDb(e, userHouseholdId)
          ),
          loading: false,
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
        if (!response.ok) throw new Error("Failed to load fixed expenses");

        const { expenses: loadedExpenses } = await response.json();
        const dbExpenses: DbFixedExpense[] = loadedExpenses || [];

        setState((prev) => ({
          ...prev,
          expenses: dbExpenses,
          loading: false,
          addingNewExpense: !dbExpenses.length,
        }));

        if (dbExpenses.length > 0) {
          updateStepData(dbExpenses);
        }
      } catch (error) {
        console.error("Error loading fixed expenses:", error);
        toast.error("Failed to load fixed expenses");
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    loadFixedExpenses();
  }, [userHouseholdId, getStepData, updateStepData]);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (state.expenses.length === 0) {
        toast.error("Please add at least one fixed expense before continuing");
        return;
      }
      onComplete();
    },
  }));

  if (userLoading) return <div>Loading...</div>;
  if (userError) return <div>Error loading user data.</div>;
  if (!userHouseholdId) return <div>No household found.</div>;

  const handleAddExpense = () => {
    setState((prev) => ({
      ...prev,
      addingNewExpense: true,
      editingExpense: null,
    }));
  };

  const handleEditExpense = (expense: DbFixedExpense) => {
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
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete expense");

      const updatedExpenses = state.expenses.filter(
        (expense) => expense.id !== expenseId
      );
      setState((prev) => ({ ...prev, expenses: updatedExpenses }));
      updateStepData(updatedExpenses);
      toast.success("Expense deleted successfully");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const handleSaveExpense = async (formData: any) => {
    setState((prev) => ({ ...prev, saving: true }));
    const isEditing = !!state.editingExpense;

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
      const savedExpense: DbFixedExpense = await response.json();

      const updatedExpenses = isEditing
        ? state.expenses.map((exp) =>
            exp.id === savedExpense.id ? savedExpense : exp
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
      toast.success(`Expense ${isEditing ? "updated" : "added"} successfully`);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
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
    ? state.expenses.find((exp) => exp.id === state.editingExpense)
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

      {state.expenses.length > 0 &&
        !state.addingNewExpense &&
        !state.editingExpense && (
          <div
            ref={parentRef}
            className="h-[450px] overflow-y-auto rounded-lg border bg-gray-50/50"
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
                      padding: "0.5rem",
                    }}
                  >
                    <ExpenseSourceSummaryCard
                      expense={mapDbExpenseToContext(expense)}
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
            saving={state.saving}
          />
        </Suspense>
      )}
    </div>
  );
});

StepFixedExpenses.displayName = "StepFixedExpenses";

export { StepFixedExpenses };
