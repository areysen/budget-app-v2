import { Tables } from "@/types/supabase";

export type FrequencyType =
  | "monthly"
  | "biweekly"
  | "weekly"
  | "yearly"
  | "quarterly"
  | "semi_monthly"
  | "per_paycheck";

export interface BaseFrequencyConfig {
  type: FrequencyType;
  [key: string]: any;
}

export interface MonthlyConfig extends BaseFrequencyConfig {
  type: "monthly";
  day_of_month: number | null; // null if end of month
  is_end_of_month: boolean;
}

export interface BiweeklyConfig extends BaseFrequencyConfig {
  type: "biweekly";
  day_of_week: string; // 'monday', 'tuesday', etc.
}

export interface WeeklyConfig extends BaseFrequencyConfig {
  type: "weekly";
  day_of_week: string;
}

export interface YearlyConfig extends BaseFrequencyConfig {
  type: "yearly";
  month: number; // 1-12
  day: number; // 1-31
}

export interface QuarterlyConfig extends BaseFrequencyConfig {
  type: "quarterly";
  quarterly_type: "regular" | "custom";
  day_of_month?: number; // for regular quarterly
  custom_dates?: string[]; // ['03-15', '06-18', '09-19', '12-09'] for custom
}

export interface SemiMonthlyConfig extends BaseFrequencyConfig {
  type: "semi_monthly";
  first_day: number;
  second_day: number | null; // null if second is EOM
  second_is_eom: boolean;
}

export interface PerPaycheckConfig extends BaseFrequencyConfig {
  type: "per_paycheck";
  trigger: "period_start" | "pay_date";
}

export type FrequencyConfig =
  | MonthlyConfig
  | BiweeklyConfig
  | WeeklyConfig
  | YearlyConfig
  | QuarterlyConfig
  | SemiMonthlyConfig
  | PerPaycheckConfig;

export interface FrequencyItem {
  id: string;
  frequency_type: FrequencyType;
  frequency_config: FrequencyConfig;
  anchor_date: string | null;
  next_due_date?: string | null;
}

// Extend Supabase types with proper frequency typing
export type FixedExpenseWithFrequency = Tables<"fixed_expenses"> & {
  frequency_config: FrequencyConfig | null;
  frequency_type: FrequencyType | null;
};

export type IncomeSourceWithFrequency = Tables<"income_sources"> & {
  frequency_config: FrequencyConfig | null;
  frequency_type: FrequencyType | null;
};

// Helper function to convert frequency config to JSON
export const frequencyConfigToJson = (config: FrequencyConfig | null): any => {
  if (!config) return null;
  return JSON.parse(JSON.stringify(config));
};

// Helper function to convert JSON to frequency config
export const jsonToFrequencyConfig = (json: any): FrequencyConfig | null => {
  if (!json) return null;
  return json as FrequencyConfig;
};
