import {
  FrequencyConfig,
  FrequencyType,
  FixedExpenseWithFrequency,
  IncomeSourceWithFrequency,
} from "@/types/frequency";
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  endOfMonth,
  setDate,
  format,
  parseISO,
  startOfWeek,
  getDay,
  getDate,
  getMonth,
  isAfter,
  isBefore,
  isEqual,
  startOfMonth,
  endOfDay,
  addQuarters,
  setMonth,
  setYear,
} from "date-fns";

type FrequencyItem = FixedExpenseWithFrequency | IncomeSourceWithFrequency;

export class FrequencyCalculator {
  /**
   * Calculate the next occurrence date for a frequency item
   */
  calculateNextOccurrence(
    item: FrequencyItem,
    fromDate: Date = new Date()
  ): Date {
    if (!item.frequency_config) {
      throw new Error("Frequency config is required");
    }

    switch (item.frequency_type) {
      case "monthly":
        return this.calculateMonthlyNext(item.frequency_config, fromDate);
      case "biweekly":
        return this.calculateBiweeklyNext(
          item.frequency_config,
          item.anchor_date,
          fromDate
        );
      case "weekly":
        return this.calculateWeeklyNext(
          item.frequency_config,
          item.anchor_date,
          fromDate
        );
      case "yearly":
        return this.calculateYearlyNext(item.frequency_config, fromDate);
      case "quarterly":
        return this.calculateQuarterlyNext(item.frequency_config, fromDate);
      case "semi_monthly":
        return this.calculateSemiMonthlyNext(item.frequency_config, fromDate);
      case "per_paycheck":
        throw new Error("Per-paycheck items require paycheck period context");
      default:
        throw new Error(`Unsupported frequency type: ${item.frequency_type}`);
    }
  }

  /**
   * Get all occurrences of an item within a date range
   */
  getOccurrencesInPeriod(
    item: FrequencyItem,
    startDate: Date,
    endDate: Date,
    paycheckPeriods?: Array<{ start_date: string; end_date: string }>
  ): Date[] {
    const occurrences: Date[] = [];

    if (item.frequency_type === "per_paycheck") {
      return this.getPerPaycheckOccurrences(
        item.frequency_config,
        paycheckPeriods || []
      );
    }

    let currentDate = new Date(startDate);
    const maxIterations = 100; // Safety net
    let iterations = 0;

    while (currentDate <= endDate && iterations < maxIterations) {
      try {
        const nextOccurrence = this.calculateNextOccurrence(item, currentDate);

        if (nextOccurrence > endDate) break;
        if (nextOccurrence >= startDate) {
          occurrences.push(nextOccurrence);
        }

        currentDate = addDays(nextOccurrence, 1);
        iterations++;
      } catch (error) {
        console.error("Error calculating occurrence:", error);
        break;
      }
    }

    return occurrences;
  }

  // Private calculation methods for each frequency type
  private calculateMonthlyNext(config: any, fromDate: Date): Date {
    if (config.is_end_of_month) {
      // Enhanced EOM handling
      let currentMonth = fromDate.getMonth();
      let currentYear = fromDate.getFullYear();

      // Get end of current month
      let endOfCurrentMonth = endOfMonth(
        new Date(currentYear, currentMonth, 1)
      );

      // If we're past EOM for this month, move to next month's EOM
      if (fromDate >= endOfCurrentMonth) {
        currentMonth += 1;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear += 1;
        }
      }
      return endOfMonth(new Date(currentYear, currentMonth, 1));
    } else {
      // Existing logic for specific day of month
      let nextDate = setDate(fromDate, config.day_of_month);
      if (nextDate <= fromDate) {
        nextDate = setDate(addMonths(fromDate, 1), config.day_of_month);
      }
      return nextDate;
    }
  }

  private calculateBiweeklyNext(
    config: any,
    anchorDate: string | null,
    fromDate: Date
  ): Date {
    const { day_of_week } = config;

    if (!anchorDate) {
      throw new Error("Anchor date is required for biweekly frequency");
    }

    const anchor = parseISO(anchorDate);
    const targetDayOfWeek = this.getDayOfWeekNumber(day_of_week);

    // Find the next occurrence of the target day of week
    let nextDate = startOfWeek(fromDate, { weekStartsOn: 1 }); // Monday start
    while (getDay(nextDate) !== targetDayOfWeek) {
      nextDate = addDays(nextDate, 1);
    }

    // If this date is before or equal to fromDate, move to next week
    if (!isAfter(nextDate, fromDate)) {
      nextDate = addWeeks(nextDate, 1);
    }

    // Calculate weeks from anchor date
    const weeksFromAnchor = Math.ceil(
      (nextDate.getTime() - anchor.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    // Ensure it's every other week (biweekly)
    if (weeksFromAnchor % 2 !== 0) {
      nextDate = addWeeks(nextDate, 1);
    }

    return nextDate;
  }

  private calculateWeeklyNext(
    config: any,
    anchorDate: string | null,
    fromDate: Date
  ): Date {
    const { day_of_week } = config;
    const targetDayOfWeek = this.getDayOfWeekNumber(day_of_week);

    // Find the next occurrence of the target day of week
    let nextDate = startOfWeek(fromDate, { weekStartsOn: 1 }); // Monday start
    while (getDay(nextDate) !== targetDayOfWeek) {
      nextDate = addDays(nextDate, 1);
    }

    // If this date is before or equal to fromDate, move to next week
    if (!isAfter(nextDate, fromDate)) {
      nextDate = addWeeks(nextDate, 1);
    }

    return nextDate;
  }

  private calculateYearlyNext(config: any, fromDate: Date): Date {
    const { month, day } = config;

    let nextDate = setMonth(fromDate, month - 1); // month is 1-12, setMonth expects 0-11
    nextDate = setDate(nextDate, day);
    nextDate = setYear(nextDate, fromDate.getFullYear());

    // If the date has passed this year, move to next year
    if (isBefore(nextDate, fromDate)) {
      nextDate = setYear(nextDate, fromDate.getFullYear() + 1);
    }

    return nextDate;
  }

  private calculateQuarterlyNext(config: any, fromDate: Date): Date {
    const { quarterly_type, day_of_month, custom_dates } = config;

    if (quarterly_type === "custom" && custom_dates) {
      return this.calculateCustomQuarterlyNext(custom_dates, fromDate);
    } else {
      // Regular quarterly (every 3 months on same day)
      const targetDay = day_of_month || 1;
      let nextDate = setDate(fromDate, targetDay);

      // Find the next quarter
      const currentQuarter = Math.floor(getMonth(fromDate) / 3);
      const nextQuarter = currentQuarter + 1;
      const nextQuarterMonth = nextQuarter * 3;

      nextDate = setMonth(nextDate, nextQuarterMonth);

      // If this date is before fromDate, move to next year
      if (isBefore(nextDate, fromDate)) {
        nextDate = setYear(nextDate, fromDate.getFullYear() + 1);
        nextDate = setMonth(nextDate, 0); // January
      }

      return nextDate;
    }
  }

  private calculateCustomQuarterlyNext(
    customDates: string[],
    fromDate: Date
  ): Date {
    const currentYear = fromDate.getFullYear();
    const nextYear = currentYear + 1;

    // Check dates in current year
    for (const dateStr of customDates) {
      const [month, day] = dateStr.split("-").map(Number);
      const checkDate = new Date(currentYear, month - 1, day);

      if (isAfter(checkDate, fromDate)) {
        return checkDate;
      }
    }

    // If all dates in current year have passed, check next year
    for (const dateStr of customDates) {
      const [month, day] = dateStr.split("-").map(Number);
      const checkDate = new Date(nextYear, month - 1, day);

      if (isAfter(checkDate, fromDate)) {
        return checkDate;
      }
    }

    // Fallback to first date of next year
    const [month, day] = customDates[0].split("-").map(Number);
    return new Date(nextYear, month - 1, day);
  }

  private calculateSemiMonthlyNext(config: any, fromDate: Date): Date {
    const currentDay = fromDate.getDate();
    const currentMonth = fromDate.getMonth();
    const currentYear = fromDate.getFullYear();

    // First payment date
    const firstPaymentDate = new Date(
      currentYear,
      currentMonth,
      config.first_day
    );

    // Second payment date (handle EOM)
    let secondPaymentDate: Date;
    if (config.second_is_eom) {
      secondPaymentDate = endOfMonth(new Date(currentYear, currentMonth, 1));
    } else {
      secondPaymentDate = new Date(
        currentYear,
        currentMonth,
        config.second_day
      );
    }

    // Determine next payment
    if (fromDate < firstPaymentDate) {
      return firstPaymentDate;
    } else if (fromDate < secondPaymentDate) {
      return secondPaymentDate;
    } else {
      // Move to next month's first payment
      const nextMonth = currentMonth + 1;
      const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
      const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;
      return new Date(nextYear, adjustedMonth, config.first_day);
    }
  }

  private getPerPaycheckOccurrences(
    config: any,
    paycheckPeriods: Array<{ start_date: string; end_date: string }>
  ): Date[] {
    const { trigger } = config;
    const occurrences: Date[] = [];

    for (const period of paycheckPeriods) {
      if (trigger === "period_start") {
        occurrences.push(parseISO(period.start_date));
      } else if (trigger === "pay_date") {
        // For pay_date, we'll use the start date as proxy
        // In a real implementation, you might have actual pay dates
        occurrences.push(parseISO(period.start_date));
      }
    }

    return occurrences;
  }

  private getDayOfWeekNumber(dayOfWeek: string): number {
    const dayMap: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    return dayMap[dayOfWeek.toLowerCase()] || 1; // Default to Monday
  }
}

// Export singleton instance
export const frequencyCalculator = new FrequencyCalculator();
