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

          // Update both state and context
          setState((prev) => ({
            ...prev,
            primaryIncome: convertedPrimary,
            secondaryIncomes: convertedSecondary,
            loading: false,
            editingPrimary: !convertedPrimary,
          }));

          // Only update context if we have new data
          if (convertedPrimary || convertedSecondary.length > 0) {
            updateStepData(convertedPrimary, convertedSecondary);
          }
        } catch (error) {
          console.error("Error loading income sources:", error);
          toast.error("Failed to load income sources");
          setState((prev) => ({ ...prev, loading: false }));
        }
      };

      loadIncomeSources();
    }, [householdId, updateStepData]); // Remove getStepData from dependencies to prevent cycles

    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (!state.primaryIncome) {
          toast.error("Please add a primary income source before continuing");
          return;
        }
        onComplete();
      },
    }));

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
                        is_primary: true,
                        household_id: householdId,
                      }
                    : {
                        ...data,
                        is_primary: true,
                        householdId: householdId,
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

                  const { incomeSource } = await response.json();
                  const convertedIncome =
                    convertDbIncomeToFrontend(incomeSource);

                  setState((prev: IncomeFormState) => ({
                    ...prev,
                    primaryIncome: convertedIncome,
                    editingPrimary: false,
                    saving: false,
                  }));

                  updateStepData(convertedIncome, state.secondaryIncomes);
                  toast.success("Primary income saved successfully!");
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
                  editingPrimary: false,
                }))
              }
            />
          ) : state.primaryIncome ? (
            <IncomeSourceSummaryCard
              income={state.primaryIncome}
              onEdit={() =>
                setState((prev: IncomeFormState) => ({
                  ...prev,
                  editingPrimary: true,
                }))
              }
            />
          ) : (
            <Card className="p-6">
              <Button
                onClick={() =>
                  setState((prev: IncomeFormState) => ({
                    ...prev,
                    editingPrimary: true,
                  }))
                }
              >
                Add Primary Income
              </Button>
            </Card>
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
                        is_primary: false,
                        householdId: householdId,
                      }),
                    }
                  );

                  if (!response.ok) {
                    throw new Error("Failed to save income source");
                  }

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
                  toast.success("Secondary income saved successfully!");
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
                      onEdit={() =>
                        setState((prev: IncomeFormState) => ({
                          ...prev,
                          editingSecondary: income.id,
                        }))
                      }
                      onDelete={async () => {
                        try {
                          setState((prev: IncomeFormState) => ({
                            ...prev,
                            saving: true,
                          }));

                          const response = await fetch(
                            `/api/budget-setup/income-sources?id=${income.id}`,
                            {
                              method: "DELETE",
                            }
                          );

                          if (!response.ok) {
                            throw new Error("Failed to delete income source");
                          }

                          setState((prev: IncomeFormState) => ({
                            ...prev,
                            secondaryIncomes: prev.secondaryIncomes.filter(
                              (i) => i.id !== income.id
                            ),
                            saving: false,
                          }));

                          updateStepData(
                            state.primaryIncome,
                            state.secondaryIncomes.filter(
                              (i) => i.id !== income.id
                            )
                          );
                          toast.success(
                            "Secondary income deleted successfully!"
                          );
                        } catch (error) {
                          console.error("Error deleting income source:", error);
                          toast.error(
                            "Failed to delete income source. Please try again."
                          );
                          setState((prev: IncomeFormState) => ({
                            ...prev,
                            saving: false,
                          }));
                        }
                      }}
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
