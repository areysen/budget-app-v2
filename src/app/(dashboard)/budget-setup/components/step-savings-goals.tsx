"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
  useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useBudgetSetup } from "../budget-setup-context";
import { SavingsGoalSummaryCard } from "./savings-goal-summary-card";
import { SavingsGoalForm } from "./savings-goal-form";
import { useUser } from "@/hooks/use-user";
import { Tables } from "@/types/supabase";

type DbSavingsGoal = Tables<"savings_goals">;

// Type for the form component that matches database schema
interface FormSavingsGoal {
  id?: string;
  name: string;
  description?: string;
  target_amount: number;
  target_date?: string;
  current_balance: number;
  is_emergency_fund: boolean;
  is_roundup_target: boolean;
  sort_order: number;
}

interface SavingsGoalState {
  goals: DbSavingsGoal[];
  editingGoal: string | null;
  addingNewGoal: boolean;
  loading: boolean;
  saving: boolean;
}

interface StepSavingsGoalsProps {
  householdId: string;
  onComplete: () => void;
}

const StepSavingsGoals = forwardRef<
  { submit: () => void },
  StepSavingsGoalsProps
>(function StepSavingsGoals({ householdId, onComplete }, ref) {
  const { getStepData, setStepData } = useBudgetSetup();
  const {
    householdId: userHouseholdId,
    loading: userLoading,
    error: userError,
  } = useUser();

  // Initialize state with data from context if available
  const [state, setState] = useState<SavingsGoalState>(() => {
    const existingData = getStepData("savingsGoals");
    return {
      goals: existingData?.goals
        ? convertContextGoalsToDb(existingData.goals)
        : [],
      editingGoal: null,
      addingNewGoal: !existingData?.goals?.length,
      loading: false,
      saving: false,
    };
  });

  const hasAttemptedLoad = useRef(false);

  // Convert context goals to database format
  function convertContextGoalsToDb(contextGoals: any[]): DbSavingsGoal[] {
    return contextGoals.map((goal) => ({
      id: goal.id || crypto.randomUUID(),
      household_id: userHouseholdId || "",
      name: goal.name || "",
      description: goal.description || null,
      target_amount: goal.targetAmount || goal.target_amount || 0,
      target_date: goal.targetDate || goal.target_date || null,
      current_balance: goal.currentAmount || goal.current_balance || 0,
      is_emergency_fund:
        goal.isEmergencyFund || goal.is_emergency_fund || false,
      is_roundup_target:
        goal.isRoundupTarget || goal.is_roundup_target || false,
      sort_order: goal.sort_order || 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
    }));
  }

  // Convert database goals to context format
  function convertDbGoalsToContext(dbGoals: DbSavingsGoal[]) {
    return dbGoals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.target_amount || 0,
      currentAmount: goal.current_balance || 0,
      targetDate: goal.target_date || undefined,
      isEmergencyFund: goal.is_emergency_fund || false,
      isRoundupTarget: goal.is_roundup_target || false,
      defaultContribution: 0, // Not in database, set default
    }));
  }

  // Load existing goals from API
  useEffect(() => {
    const loadGoals = async () => {
      if (!userHouseholdId || hasAttemptedLoad.current) return;

      // Check if we already have data in context
      const existingData = getStepData("savingsGoals");
      if (existingData?.goals?.length) {
        const dbGoals = convertContextGoalsToDb(existingData.goals);
        setState((prev) => ({
          ...prev,
          goals: dbGoals,
          addingNewGoal: false,
        }));
        hasAttemptedLoad.current = true;
        return;
      }

      try {
        hasAttemptedLoad.current = true;
        setState((prev) => ({ ...prev, loading: true }));

        const response = await fetch(
          `/api/budget-setup/savings-goals?householdId=${userHouseholdId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load savings goals");
        }

        const { goals: loadedGoals } = await response.json();
        const dbGoals = loadedGoals || [];

        setState((prev) => ({
          ...prev,
          goals: dbGoals,
          loading: false,
          addingNewGoal: !dbGoals.length,
        }));

        // Update context with loaded data
        if (dbGoals.length) {
          setStepData("savingsGoals", {
            goals: convertDbGoalsToContext(dbGoals),
          });
        }
      } catch (error) {
        console.error("Error loading savings goals:", error);
        toast.error("Failed to load savings goals. Please try again.");
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    loadGoals();
  }, [userHouseholdId, getStepData, setStepData]);

  // Imperative handle for parent component
  useImperativeHandle(ref, () => ({
    submit: () => {
      if (state.goals.length === 0) {
        toast.error("Please add at least one savings goal before continuing");
        return;
      }
      onComplete();
    },
  }));

  // Handle adding new goal
  const handleAddGoal = () => {
    setState((prev) => ({
      ...prev,
      addingNewGoal: true,
      editingGoal: null,
    }));
  };

  // Handle editing existing goal
  const handleEditGoal = (goal: DbSavingsGoal) => {
    setState((prev) => ({
      ...prev,
      editingGoal: goal.id,
      addingNewGoal: false,
    }));
  };

  // Handle deleting goal
  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(
        `/api/budget-setup/savings-goals?householdId=${userHouseholdId}&id=${goalId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete savings goal");
      }

      const updatedGoals = state.goals.filter((goal) => goal.id !== goalId);
      setState((prev) => ({ ...prev, goals: updatedGoals }));

      // Update context
      setStepData("savingsGoals", {
        goals: convertDbGoalsToContext(updatedGoals),
      });

      toast.success("Savings goal deleted successfully");
    } catch (error) {
      console.error("Error deleting savings goal:", error);
      toast.error("Failed to delete savings goal. Please try again.");
    }
  };

  // Handle saving goal (create or update)
  const handleSaveGoal = async (formData: Partial<FormSavingsGoal>) => {
    try {
      setState((prev) => ({ ...prev, saving: true }));

      const goalData = {
        ...formData,
        household_id: userHouseholdId,
        id: state.editingGoal || undefined,
      };

      const response = await fetch("/api/budget-setup/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        throw new Error("Failed to save savings goal");
      }

      const { goal: savedGoal } = await response.json();

      // Update local state
      const updatedGoals = state.editingGoal
        ? state.goals.map((goal) =>
            goal.id === state.editingGoal ? savedGoal : goal
          )
        : [...state.goals, savedGoal];

      // Sort by sort_order
      updatedGoals.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      setState((prev) => ({
        ...prev,
        goals: updatedGoals,
        editingGoal: null,
        addingNewGoal: false,
        saving: false,
      }));

      // Update context
      setStepData("savingsGoals", {
        goals: convertDbGoalsToContext(updatedGoals),
      });

      toast.success(
        `Savings goal ${state.editingGoal ? "updated" : "added"} successfully`
      );
    } catch (error) {
      console.error("Error saving savings goal:", error);
      setState((prev) => ({ ...prev, saving: false }));
      toast.error("Failed to save savings goal. Please try again.");
    }
  };

  // Handle canceling form
  const handleCancelForm = () => {
    setState((prev) => ({
      ...prev,
      editingGoal: null,
      addingNewGoal: false,
    }));
  };

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

  const currentGoal = state.editingGoal
    ? state.goals.find((goal) => goal.id === state.editingGoal)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Savings Goals</h2>
          <p className="text-sm text-muted-foreground">
            Set up your long-term savings targets and emergency funds
          </p>
        </div>
        {!state.addingNewGoal && !state.editingGoal && (
          <Button onClick={handleAddGoal} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Goal
          </Button>
        )}
      </div>

      {/* Content */}
      {state.loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading savings goals...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {!state.addingNewGoal && !state.editingGoal && (
            <div className="space-y-4">
              {state.goals.map((goal) => (
                <SavingsGoalSummaryCard
                  key={goal.id}
                  goal={{
                    id: goal.id,
                    name: goal.name,
                    description: goal.description || undefined,
                    target_amount: goal.target_amount || 0,
                    target_date: goal.target_date || undefined,
                    current_balance: goal.current_balance || 0,
                    is_emergency_fund: goal.is_emergency_fund || false,
                    is_roundup_target: goal.is_roundup_target || false,
                    sort_order: goal.sort_order || 0,
                  }}
                  onEdit={() => handleEditGoal(goal)}
                  onDelete={() => handleDeleteGoal(goal.id)}
                />
              ))}

              {state.goals.length === 0 && (
                <Card className="p-8">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      No savings goals yet. Add your first goal to get started!
                    </p>
                    <Button onClick={handleAddGoal} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Your First Goal
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Form */}
          {(state.addingNewGoal || state.editingGoal) && (
            <SavingsGoalForm
              goal={
                currentGoal
                  ? {
                      id: currentGoal.id,
                      name: currentGoal.name,
                      description: currentGoal.description || undefined,
                      target_amount: currentGoal.target_amount || 0,
                      target_date: currentGoal.target_date || undefined,
                      current_balance: currentGoal.current_balance || 0,
                      is_emergency_fund: currentGoal.is_emergency_fund || false,
                      is_roundup_target: currentGoal.is_roundup_target || false,
                      sort_order: currentGoal.sort_order || 0,
                    }
                  : undefined
              }
              onSave={handleSaveGoal}
              onCancel={handleCancelForm}
              saving={state.saving}
            />
          )}
        </>
      )}
    </div>
  );
});

StepSavingsGoals.displayName = "StepSavingsGoals";

export { StepSavingsGoals };
