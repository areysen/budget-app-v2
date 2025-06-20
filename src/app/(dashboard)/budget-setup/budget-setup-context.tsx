import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { FrequencyType, FrequencyConfig } from "@/types/frequency";
import { Tables } from "@/types/supabase";

// --- Step Data Types ---
export type IncomeSource = Omit<
  Tables<"income_sources">,
  "frequency_type" | "frequency_config"
> & {
  frequency_type: FrequencyType | null;
  frequency_config: FrequencyConfig | null;
};

export interface IncomeStepData {
  primaryIncome: IncomeSource | null;
  secondaryIncomes: IncomeSource[];
}

export interface BudgetIncomeStep {
  primary: IncomeSource;
  secondary: IncomeSource[];
  payScheduleType: "semi-monthly" | "bi-weekly" | "monthly";
}

export interface FixedExpense {
  id: string;
  name: string;
  category: string;
  amount: number;
  isVariable: boolean;
  notes?: string;

  // Enhanced frequency fields
  frequency_type: FrequencyType | null;
  frequency_config: FrequencyConfig | null;
  anchor_date: string | null;
  next_due_date: string | null;

  // Backward compatibility
  dueDay?: number;
  frequency?: "monthly" | "quarterly" | "annual";
}
export interface BudgetFixedExpensesStep {
  expenses: FixedExpense[];
}

export type Envelope = {
  id: string;
  name: string;
  amount: number;
  rolloverRule: "rollover" | "rollover_limit" | "save";
  rolloverLimit?: number | null;
};

export interface BudgetEnvelopesStep {
  envelopes: Envelope[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  isEmergencyFund: boolean;
  isRoundupTarget: boolean;
  defaultContribution: number;
}
export interface BudgetSavingsGoalsStep {
  goals: SavingsGoal[];
}

export interface BudgetSetupState {
  income: IncomeStepData | null;
  fixedExpenses: BudgetFixedExpensesStep | null;
  envelopes: BudgetEnvelopesStep | null;
  savingsGoals: BudgetSavingsGoalsStep | null;
}

const defaultState: BudgetSetupState = {
  income: null,
  fixedExpenses: null,
  envelopes: null,
  savingsGoals: null,
};

const LOCAL_STORAGE_KEY = "budget-setup-wizard";

// --- Context ---
export type BudgetSetupContextType = {
  stepData: BudgetSetupState;
  getStepData: <K extends keyof BudgetSetupState>(
    step: K
  ) => BudgetSetupState[K];
  setStepData: <K extends keyof BudgetSetupState>(
    step: K,
    data: NonNullable<BudgetSetupState[K]>
  ) => void;
  addIncomeSource: (source: IncomeSource) => void;
  removeIncomeSource: (id: string) => void;
  updateIncomeSource: (id: string, source: IncomeSource) => void;
  addFixedExpense: (expense: FixedExpense) => void;
  removeFixedExpense: (id: string) => void;
  updateFixedExpense: (id: string, expense: FixedExpense) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, "id">) => void;
  removeSavingsGoal: (id: string) => void;
  updateSavingsGoal: (id: string, goal: SavingsGoal) => void;
  addEnvelope: (envelope: Omit<Envelope, "id">) => void;
  removeEnvelope: (id: string) => void;
  updateEnvelope: (id: string, envelope: Partial<Omit<Envelope, "id">>) => void;
  reset: () => void;
};

const BudgetSetupContext = createContext<BudgetSetupContextType | undefined>(
  undefined
);

export function BudgetSetupProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BudgetSetupState>({
    income: null,
    fixedExpenses: null,
    savingsGoals: null,
    envelopes: null,
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setStepData = <K extends keyof BudgetSetupState>(
    step: K,
    data: NonNullable<BudgetSetupState[K]>
  ) => {
    setState((prev) => ({ ...prev, [step]: data }));
  };

  const getStepData = <K extends keyof BudgetSetupState>(
    step: K
  ): BudgetSetupState[K] => {
    return state[step];
  };

  const resetWizard = () => {
    setState(defaultState);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const removeFixedExpense = (id: string) => {
    setState((prev) => {
      if (!prev.fixedExpenses) return prev;
      return {
        ...prev,
        fixedExpenses: {
          expenses: prev.fixedExpenses.expenses.filter(
            (expense) => expense.id !== id
          ),
        },
      };
    });
  };

  return (
    <BudgetSetupContext.Provider
      value={{
        stepData: state,
        getStepData,
        setStepData,
        addIncomeSource: (source) => {
          setState((prev) => ({
            ...prev,
            income: {
              primaryIncome: source,
              secondaryIncomes: [],
            },
          }));
        },
        removeIncomeSource: (id) => {
          setState((prev) => {
            if (!prev.income) return prev;
            return {
              ...prev,
              income: {
                ...prev.income,
                secondaryIncomes: prev.income.secondaryIncomes.filter(
                  (s) => s.id !== id
                ),
              },
            };
          });
        },
        updateIncomeSource: (id, source) => {
          setState((prev) => {
            if (!prev.income) return prev;
            return {
              ...prev,
              income: {
                ...prev.income,
                secondaryIncomes: prev.income.secondaryIncomes.map((s) =>
                  s.id === id ? source : s
                ),
              },
            };
          });
        },
        addFixedExpense: (expense) => {
          setState((prev) => ({
            ...prev,
            fixedExpenses: {
              expenses: [...(prev.fixedExpenses?.expenses || []), expense],
            },
          }));
        },
        removeFixedExpense,
        updateFixedExpense: (id, expense) => {
          setState((prev) => {
            if (!prev.fixedExpenses) return prev;
            return {
              ...prev,
              fixedExpenses: {
                expenses: prev.fixedExpenses.expenses.map((e) =>
                  e.id === id ? expense : e
                ),
              },
            };
          });
        },
        addSavingsGoal: (goal) => {
          setState((prev) => ({
            ...prev,
            savingsGoals: {
              goals: [
                ...(prev.savingsGoals?.goals || []),
                { ...goal, id: crypto.randomUUID() },
              ],
            },
          }));
        },
        removeSavingsGoal: (id) => {
          setState((prev) => {
            if (!prev.savingsGoals) return prev;
            return {
              ...prev,
              savingsGoals: {
                goals: prev.savingsGoals.goals.filter((g) => g.id !== id),
              },
            };
          });
        },
        updateSavingsGoal: (id, goal) => {
          setState((prev) => {
            if (!prev.savingsGoals) return prev;
            return {
              ...prev,
              savingsGoals: {
                goals: prev.savingsGoals.goals.map((g) =>
                  g.id === id ? { ...g, ...goal } : g
                ),
              },
            };
          });
        },
        addEnvelope: (envelope) => {
          setState((prev) => ({
            ...prev,
            envelopes: {
              envelopes: [
                ...(prev.envelopes?.envelopes || []),
                { ...envelope, id: crypto.randomUUID() },
              ],
            },
          }));
        },
        removeEnvelope: (id) => {
          setState((prev) => {
            if (!prev.envelopes) return prev;
            return {
              ...prev,
              envelopes: {
                envelopes: prev.envelopes.envelopes.filter((e) => e.id !== id),
              },
            };
          });
        },
        updateEnvelope: (id, envelope) => {
          setState((prev) => {
            if (!prev.envelopes) return prev;
            return {
              ...prev,
              envelopes: {
                envelopes: prev.envelopes.envelopes.map((e) =>
                  e.id === id ? { ...e, ...envelope } : e
                ),
              },
            };
          });
        },
        reset: resetWizard,
      }}
    >
      {children}
    </BudgetSetupContext.Provider>
  );
}

export function useBudgetSetup() {
  const ctx = useContext(BudgetSetupContext);
  if (!ctx)
    throw new Error("useBudgetSetup must be used within BudgetSetupProvider");
  return ctx;
}
