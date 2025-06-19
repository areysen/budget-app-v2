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

export interface Envelope {
  name: string;
  amount: number;
  rolloverRule: "always_rollover" | "rollover_limit" | "always_to_savings";
  rolloverLimit?: number;
}
export interface BudgetEnvelopesStep {
  envelopes: Envelope[];
}

export interface SavingsGoal {
  name: string;
  targetAmount: number;
  targetDate?: string;
  isEmergencyFund: boolean;
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
interface BudgetSetupContextType {
  state: BudgetSetupState;
  setStepData: <K extends keyof BudgetSetupState>(
    step: K,
    data: NonNullable<BudgetSetupState[K]>
  ) => void;
  getStepData: <K extends keyof BudgetSetupState>(
    step: K
  ) => BudgetSetupState[K];
  resetWizard: () => void;
}

const BudgetSetupContext = createContext<BudgetSetupContextType | undefined>(
  undefined
);

export function BudgetSetupProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BudgetSetupState>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    }
    return defaultState;
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

  return (
    <BudgetSetupContext.Provider
      value={{ state, setStepData, getStepData, resetWizard }}
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
