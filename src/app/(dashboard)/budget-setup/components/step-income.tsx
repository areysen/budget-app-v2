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
import { useBudgetSetup, IncomeSource } from "../budget-setup-context";
import { toast } from "react-hot-toast";
import { Tables } from "@/types/supabase";
import { IncomeSourceSummaryCard } from "./income-source-summary-card";
import { IncomeSourceForm } from "./income-source-form";
import { useUser } from "@/hooks/use-user";
import {
  FrequencyType,
  FrequencyConfig,
  frequencyConfigToJson,
  jsonToFrequencyConfig,
} from "@/types/frequency";

type DbIncomeSource = Tables<"income_sources">;

// Helper function to convert database income to frontend income
const convertDbIncomeToFrontend = (dbIncome: DbIncomeSource): IncomeSource => {
  return {
    ...dbIncome,
    frequency_type: dbIncome.frequency_type as FrequencyType,
    frequency_config: jsonToFrequencyConfig(dbIncome.frequency_config),
  };
};

// Helper function to convert frontend income to form data
const convertIncomeToFormData = (income: IncomeSource | null) => {
  if (!income) return undefined;
  return {
    name: income.name,
    amount: income.amount,
    frequency_type: income.frequency_type || "monthly",
    frequency_config: income.frequency_config,
    anchor_date: income.anchor_date,
    next_payment_date: income.next_payment_date,
    household_id: income.household_id,
  };
};

interface IncomeFormState {
  primaryIncome: IncomeSource | null;
  secondaryIncomes: IncomeSource[];
  editingPrimary: boolean;
  editingSecondary: string | null;
  addingNewSecondary: boolean;
  loading: boolean;
  saving: boolean;
}

interface StepIncomeProps {
  householdId: string;
  onComplete: () => void;
}

const StepIncome = forwardRef<{ submit: () => void }, StepIncomeProps>(
  function StepIncome({ householdId, onComplete }, ref) {
    const { getStepData, setStepData } = useBudgetSetup();
    const { loading: userLoading, error: userError } = useUser();
    const [state, setState] = useState<IncomeFormState>(() => {
      const existingData = getStepData("income");
      return {
        primaryIncome: existingData?.primaryIncome ?? null,
        secondaryIncomes: existingData?.secondaryIncomes ?? [],
        editingPrimary: !existingData?.primaryIncome,
        editingSecondary: null,
        addingNewSecondary: false,
        loading: false,
        saving: false,
      };
    });

    // Memoize the update function to prevent unnecessary re-renders
    const updateStepData = useCallback(
      (
        primaryIncome: IncomeSource | null,
        secondaryIncomes: IncomeSource[]
      ) => {
        setStepData("income", {
          primaryIncome,
          secondaryIncomes,
        });
      },
      [setStepData]
    );

    // Only fetch data if we don't have it in state or context
    useEffect(() => {
      const loadIncomeSources = async () => {
        // Skip if we're already loading or if we have data
        if (
          state.loading ||
          state.primaryIncome ||
          state.secondaryIncomes.length > 0
        ) {
          return;
        }

        // Check context for data
        const existingData = getStepData("income");
        if (
          existingData?.primaryIncome ||
          (existingData?.secondaryIncomes &&
            existingData.secondaryIncomes.length > 0)
        ) {
          setState((prev) => ({
            ...prev,
            primaryIncome: existingData.primaryIncome || null,
            secondaryIncomes: existingData.secondaryIncomes || [],
            editingPrimary: !existingData.primaryIncome,
          }));
          return;
        }

        try {
          setState((prev) => ({ ...prev, loading: true }));
          const response = await fetch(
            `/api/budget-setup/income-sources?householdId=${householdId}`
          );

          if (!response.ok) {
            throw new Error("Failed to load income sources");
          }

          const { primaryIncome, secondaryIncomes } = await response.json();

          const convertedPrimary = primaryIncome
            ? convertDbIncomeToFrontend(primaryIncome)
            : null;
          const convertedSecondary = secondaryIncomes.map(
            convertDbIncomeToFrontend
          );

          setState((prev) => ({
            ...prev,
            primaryIncome: convertedPrimary,
            secondaryIncomes: convertedSecondary,
            editingPrimary: !convertedPrimary,
            loading: false,
          }));

          // Update context with loaded data
          updateStepData(convertedPrimary, convertedSecondary);
        } catch (error) {
          console.error("Error loading income sources:", error);
          setState((prev) => ({ ...prev, loading: false }));
          // Don't show error toast here, just silently fail and allow manual entry
        }
      };

      if (householdId && !userLoading) {
        loadIncomeSources();
      }
    }, [householdId, userLoading]);

    // Expose submit method to parent
    useImperativeHandle(ref, () => ({
      submit: () => {
        if (!state.primaryIncome) {
          toast.error("Please add your primary income source");
          return;
        }
        onComplete();
      },
    }));

    const handleDeleteIncome = async (id: string) => {
      if (!confirm("Are you sure you want to delete this income source?")) {
        return;
      }

      try {
        const response = await fetch(
          `/api/budget-setup/income-sources?id=${id}&householdId=${householdId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete income source");
        }

        setState((prev) => ({
          ...prev,
          secondaryIncomes: prev.secondaryIncomes.filter(
            (income) => income.id !== id
          ),
        }));

        updateStepData(
          state.primaryIncome,
          state.secondaryIncomes.filter((income) => income.id !== id)
        );

        toast.success("Income source deleted successfully");
      } catch (error) {
        console.error("Error deleting income source:", error);
        toast.error("Failed to delete income source");
      }
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
            variant="outline"
            onClick={() => (window.location.href = "/auth/signin")}
          >
            Sign In
          </Button>
        </div>
      );
    }

    // Show error if no household ID
    if (!householdId) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-red-500">
          <p>No household found. Please create or join a household first.</p>
        </div>
      );
    }

    if (state.loading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Income Sources</h2>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Primary Income</h3>
          {state.editingPrimary ? (
            <IncomeSourceForm
              title={
                state.primaryIncome
                  ? "Edit Primary Income"
                  : "Add Primary Income"
              }
              submitLabel="Save Income"
              cancelLabel="Cancel"
              isLoading={state.saving}
              existingData={convertIncomeToFormData(state.primaryIncome)}
              onSubmit={async (data) => {
                try {
                  setState((prev: IncomeFormState) => ({
                    ...prev,
                    saving: true,
                  }));

                  const method = state.primaryIncome ? "PUT" : "POST";
                  const body = state.primaryIncome
                    ? {
                        ...data,
                        id: state.primaryIncome.id,
                        household_id: householdId,
                        is_primary: true,
                      }
                    : {
                        ...data,
                        householdId: householdId,
                        is_primary: true,
                      };

                  const response = await fetch(
                    "/api/budget-setup/income-sources",
                    {
                      method,
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(body),
                    }
                  );

                  if (!response.ok) {
                    throw new Error("Failed to save income source");
                  }

                  // IMPORTANT FIX: Destructure the incomeSource from response
                  const { incomeSource } = await response.json();
                  const convertedIncome =
                    convertDbIncomeToFrontend(incomeSource);

                  setState((prev) => ({
                    ...prev,
                    primaryIncome: convertedIncome,
                    editingPrimary: false,
                    saving: false,
                  }));

                  updateStepData(convertedIncome, state.secondaryIncomes);
                  toast.success("Income source saved successfully");
                } catch (error) {
                  console.error("Error saving income source:", error);
                  toast.error("Failed to save income source");
                  setState((prev) => ({ ...prev, saving: false }));
                }
              }}
              onCancel={() => {
                setState((prev) => ({
                  ...prev,
                  editingPrimary: false,
                }));
              }}
            />
          ) : (
            <>
              {state.primaryIncome ? (
                <IncomeSourceSummaryCard
                  income={state.primaryIncome}
                  onEdit={() => {
                    setState((prev) => ({
                      ...prev,
                      editingPrimary: true,
                    }));
                  }}
                />
              ) : (
                <Card className="p-6 border-dashed">
                  <p className="text-gray-500 mb-4">
                    No primary income source added yet
                  </p>
                  <Button
                    onClick={() =>
                      setState((prev) => ({ ...prev, editingPrimary: true }))
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Primary Income
                  </Button>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Secondary Income</h3>
          {state.addingNewSecondary ? (
            <IncomeSourceForm
              title="Add Secondary Income"
              submitLabel="Save Income"
              cancelLabel="Cancel"
              isLoading={state.saving}
              onSubmit={async (data) => {
                try {
                  setState((prev: IncomeFormState) => ({
                    ...prev,
                    saving: true,
                  }));

                  const response = await fetch(
                    "/api/budget-setup/income-sources",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        ...data,
                        householdId: householdId,
                        is_primary: false,
                      }),
                    }
                  );

                  if (!response.ok) {
                    throw new Error("Failed to save income source");
                  }

                  // IMPORTANT FIX: Destructure the incomeSource from response
                  const { incomeSource } = await response.json();
                  const convertedIncome =
                    convertDbIncomeToFrontend(incomeSource);

                  setState((prev: IncomeFormState) => ({
                    ...prev,
                    secondaryIncomes: [
                      ...prev.secondaryIncomes,
                      convertedIncome,
                    ],
                    addingNewSecondary: false,
                    saving: false,
                  }));

                  updateStepData(state.primaryIncome, [
                    ...state.secondaryIncomes,
                    convertedIncome,
                  ]);
                  toast.success("Secondary income added successfully!");
                } catch (error) {
                  console.error("Error saving income source:", error);
                  toast.error(
                    "Failed to save income source. Please try again."
                  );
                  setState((prev: IncomeFormState) => ({
                    ...prev,
                    saving: false,
                  }));
                }
              }}
              onCancel={() =>
                setState((prev: IncomeFormState) => ({
                  ...prev,
                  addingNewSecondary: false,
                }))
              }
            />
          ) : state.editingSecondary ? (
            <IncomeSourceForm
              title="Edit Secondary Income"
              submitLabel="Save Income"
              cancelLabel="Cancel"
              isLoading={state.saving}
              existingData={convertIncomeToFormData(
                state.secondaryIncomes.find(
                  (income) => income.id === state.editingSecondary
                ) || null
              )}
              onSubmit={async (data) => {
                try {
                  setState((prev: IncomeFormState) => ({
                    ...prev,
                    saving: true,
                  }));

                  const incomeToUpdate = state.secondaryIncomes.find(
                    (income) => income.id === state.editingSecondary
                  );

                  if (!incomeToUpdate) {
                    throw new Error("Income source not found");
                  }

                  const response = await fetch(
                    "/api/budget-setup/income-sources",
                    {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        ...data,
                        id: incomeToUpdate.id,
                        is_primary: false,
                        household_id: householdId,
                      }),
                    }
                  );

                  if (!response.ok) {
                    throw new Error("Failed to save income source");
                  }

                  // IMPORTANT FIX: Destructure the incomeSource from response
                  const { incomeSource } = await response.json();
                  const convertedIncome =
                    convertDbIncomeToFrontend(incomeSource);

                  setState((prev: IncomeFormState) => ({
                    ...prev,
                    secondaryIncomes: prev.secondaryIncomes.map((income) =>
                      income.id === state.editingSecondary
                        ? convertedIncome
                        : income
                    ),
                    editingSecondary: null,
                    saving: false,
                  }));

                  updateStepData(
                    state.primaryIncome,
                    state.secondaryIncomes.map((income) =>
                      income.id === state.editingSecondary
                        ? convertedIncome
                        : income
                    )
                  );
                  toast.success("Secondary income updated successfully!");
                } catch (error) {
                  console.error("Error updating income source:", error);
                  toast.error(
                    "Failed to update income source. Please try again."
                  );
                  setState((prev: IncomeFormState) => ({
                    ...prev,
                    saving: false,
                  }));
                }
              }}
              onCancel={() =>
                setState((prev: IncomeFormState) => ({
                  ...prev,
                  editingSecondary: null,
                }))
              }
            />
          ) : (
            <>
              {state.secondaryIncomes.length > 0 && (
                <div className="space-y-3">
                  {state.secondaryIncomes.map((income) => (
                    <IncomeSourceSummaryCard
                      key={income.id}
                      income={income}
                      onEdit={() => {
                        setState((prev) => ({
                          ...prev,
                          editingSecondary: income.id,
                          addingNewSecondary: false,
                        }));
                      }}
                      onDelete={() => handleDeleteIncome(income.id)}
                    />
                  ))}
                </div>
              )}
              <Card className="p-6">
                <Button
                  onClick={() =>
                    setState((prev: IncomeFormState) => ({
                      ...prev,
                      addingNewSecondary: true,
                    }))
                  }
                >
                  Add Secondary Income
                </Button>
              </Card>
            </>
          )}
        </div>
      </div>
    );
  }
);

StepIncome.displayName = "StepIncome";

export { StepIncome };
