import { FrequencyConfig, FrequencyType } from "@/types/frequency";

/**
 * Create frequency config objects for common patterns
 */
export const createFrequencyConfig = {
  monthly: (dayOfMonth: number, isEndOfMonth: boolean = false) => ({
    type: "monthly" as const,
    day_of_month: isEndOfMonth ? null : dayOfMonth,
    is_end_of_month: isEndOfMonth,
  }),

  biweekly: (dayOfWeek: string, anchorDate: string) => ({
    type: "biweekly" as const,
    day_of_week: dayOfWeek.toLowerCase(),
  }),

  weekly: (dayOfWeek: string) => ({
    type: "weekly" as const,
    day_of_week: dayOfWeek.toLowerCase(),
  }),

  yearly: (month: number, day: number) => ({
    type: "yearly" as const,
    month,
    day,
  }),

  quarterly: (
    quarterlyType: "regular" | "custom",
    dayOfMonth?: number,
    customDates?: string[]
  ) => ({
    type: "quarterly" as const,
    quarterly_type: quarterlyType,
    day_of_month: quarterlyType === "regular" ? dayOfMonth : undefined,
    custom_dates: quarterlyType === "custom" ? customDates : undefined,
  }),

  semiMonthly: (
    firstDay: number,
    secondDay: number | null,
    secondIsEOM: boolean = false
  ) => ({
    type: "semi_monthly" as const,
    first_day: firstDay,
    second_day: secondDay,
    second_is_eom: secondIsEOM,
  }),

  perPaycheck: (trigger: "period_start" | "pay_date" = "period_start") => ({
    type: "per_paycheck" as const,
    trigger,
  }),
};

/**
 * Validate frequency configuration
 */
export function validateFrequencyConfig(
  type: FrequencyType,
  config: any
): boolean {
  try {
    switch (type) {
      case "monthly":
        return (
          config.type === "monthly" &&
          (config.is_end_of_month ||
            (typeof config.day_of_month === "number" &&
              config.day_of_month >= 1 &&
              config.day_of_month <= 31))
        );

      case "biweekly":
        return (
          config.type === "biweekly" &&
          typeof config.day_of_week === "string" &&
          [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ].includes(config.day_of_week.toLowerCase())
        );

      case "weekly":
        return (
          config.type === "weekly" &&
          typeof config.day_of_week === "string" &&
          [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ].includes(config.day_of_week.toLowerCase())
        );

      case "yearly":
        return (
          config.type === "yearly" &&
          typeof config.month === "number" &&
          config.month >= 1 &&
          config.month <= 12 &&
          typeof config.day === "number" &&
          config.day >= 1 &&
          config.day <= 31
        );

      case "quarterly":
        return (
          config.type === "quarterly" &&
          ["regular", "custom"].includes(config.quarterly_type) &&
          (config.quarterly_type === "regular"
            ? typeof config.day_of_month === "number" &&
              config.day_of_month >= 1 &&
              config.day_of_month <= 31
            : Array.isArray(config.custom_dates) &&
              config.custom_dates.length === 4)
        );

      case "semi_monthly":
        return (
          config.type === "semi_monthly" &&
          typeof config.first_day === "number" &&
          config.first_day >= 1 &&
          config.first_day <= 31 &&
          (config.second_is_eom ||
            (typeof config.second_day === "number" &&
              config.second_day >= 1 &&
              config.second_day <= 31))
        );

      case "per_paycheck":
        return (
          config.type === "per_paycheck" &&
          ["period_start", "pay_date"].includes(config.trigger)
        );

      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Format frequency for display
 */
export function formatFrequencyDisplay(
  type: FrequencyType,
  config: FrequencyConfig
): string {
  switch (type) {
    case "monthly": {
      const monthlyConfig = config as import("@/types/frequency").MonthlyConfig;
      if (monthlyConfig.is_end_of_month) {
        return "Monthly (End of Month)";
      } else {
        const suffix = getOrdinalSuffix(monthlyConfig.day_of_month ?? 1);
        return `Monthly (${monthlyConfig.day_of_month ?? 1}${suffix})`;
      }
    }
    case "biweekly": {
      const biweeklyConfig =
        config as import("@/types/frequency").BiweeklyConfig;
      return `Every 2 weeks (${biweeklyConfig.day_of_week})`;
    }
    case "weekly": {
      const weeklyConfig = config as import("@/types/frequency").WeeklyConfig;
      return `Weekly (${capitalizeFirst(weeklyConfig.day_of_week)})`;
    }
    case "yearly": {
      const yearlyConfig = config as import("@/types/frequency").YearlyConfig;
      const monthName = getMonthName(yearlyConfig.month);
      return `Yearly (${monthName} ${yearlyConfig.day}${getOrdinalSuffix(
        yearlyConfig.day
      )})`;
    }
    case "quarterly": {
      const quarterlyConfig =
        config as import("@/types/frequency").QuarterlyConfig;
      if (quarterlyConfig.quarterly_type === "regular") {
        return `Quarterly (${
          quarterlyConfig.day_of_month ?? ""
        }${getOrdinalSuffix(
          quarterlyConfig.day_of_month ?? 1
        )} of each quarter)`;
      } else {
        return "Quarterly (Custom dates)";
      }
    }
    case "semi_monthly": {
      const semiMonthlyConfig =
        config as import("@/types/frequency").SemiMonthlyConfig;
      const firstDisplay = `${semiMonthlyConfig.first_day}${getOrdinalSuffix(
        semiMonthlyConfig.first_day
      )}`;
      const secondDisplay = semiMonthlyConfig.second_is_eom
        ? "EOM"
        : `${semiMonthlyConfig.second_day ?? ""}${getOrdinalSuffix(
            semiMonthlyConfig.second_day ?? 1
          )}`;
      return `Semi-monthly (${firstDisplay} & ${secondDisplay})`;
    }
    case "per_paycheck": {
      const perPaycheckConfig =
        config as import("@/types/frequency").PerPaycheckConfig;
      return `Every paycheck (${
        perPaycheckConfig.trigger === "period_start"
          ? "period start"
          : "pay date"
      })`;
    }
    default:
      return String(type);
  }
}

/**
 * Get frequency options for select dropdowns
 */
export function getFrequencyOptions() {
  return [
    { value: "monthly", label: "Monthly" },
    { value: "biweekly", label: "Every 2 weeks" },
    { value: "weekly", label: "Weekly" },
    { value: "semi_monthly", label: "Semi-monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "per_paycheck", label: "Every paycheck" },
  ];
}

/**
 * Get day of week options
 */
export function getDayOfWeekOptions() {
  return [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];
}

/**
 * Get month options
 */
export function getMonthOptions() {
  return [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];
}

/**
 * Get day options (1-31)
 */
export function getDayOptions() {
  return Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}${getOrdinalSuffix(i + 1)}`,
  }));
}

// Helper functions
function getOrdinalSuffix(num: number): string {
  if (!num) return "";
  const j = num % 10,
    k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getMonthName(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month - 1] || "";
}
