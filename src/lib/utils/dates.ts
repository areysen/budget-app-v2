import {
  addDays,
  addMonths,
  endOfMonth,
  startOfMonth,
  subDays,
} from "date-fns";

export interface PaycheckDate {
  date: Date;
  isEndOfMonth: boolean;
}

/**
 * Generate paycheck dates for semi-monthly schedule
 * Returns array of dates for 1st and 15th of each month
 */
export function generatePaycheckDates(
  startDate: Date,
  endDate: Date
): PaycheckDate[] {
  const dates: PaycheckDate[] = [];
  let currentDate = startOfMonth(startDate);

  while (currentDate <= endDate) {
    // Add 1st of month
    dates.push({
      date: new Date(currentDate),
      isEndOfMonth: false,
    });

    // Add 15th of month
    const fifteenth = new Date(currentDate);
    fifteenth.setDate(15);
    dates.push({
      date: fifteenth,
      isEndOfMonth: false,
    });

    // Move to next month
    currentDate = addMonths(currentDate, 1);
  }

  return dates;
}

/**
 * Calculate period range from paycheck date
 * For 1st: 1st-14th
 * For 15th: 15th-EOM
 */
export function getPaycheckRange(
  currentPaycheck: PaycheckDate,
  nextPaycheck?: PaycheckDate
): { start: Date; end: Date } {
  const start = new Date(currentPaycheck.date);

  if (currentPaycheck.isEndOfMonth) {
    return {
      start,
      end: endOfMonth(start),
    };
  }

  if (start.getDate() === 1) {
    return {
      start,
      end: subDays(addDays(start, 14), 1), // 1st-14th
    };
  }

  if (start.getDate() === 15) {
    return {
      start,
      end: endOfMonth(start), // 15th-EOM
    };
  }

  throw new Error("Invalid paycheck date");
}

/**
 * Format a date for display
 * Example: "Jan 15, 2024"
 */
export function formatDisplayDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Format a date range for display
 * Example: "Jan 1 - Jan 14, 2024"
 */
export function formatDateRange(
  start: string | Date,
  end: string | Date
): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startMonth = startDate.toLocaleString("en-US", { month: "short" });
  const endMonth = endDate.toLocaleString("en-US", { month: "short" });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const year = startDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

/**
 * Check if a date falls within a period
 */
export function isDateInPeriod(
  date: Date,
  periodStart: Date,
  periodEnd: Date
): boolean {
  return date >= periodStart && date <= periodEnd;
}

/**
 * Get the current paycheck period based on today's date
 */
export function getCurrentPaycheckPeriod(): { start: Date; end: Date } {
  const today = new Date();
  const day = today.getDate();

  if (day < 15) {
    // 1st-14th period
    return {
      start: startOfMonth(today),
      end: subDays(addDays(startOfMonth(today), 14), 1),
    };
  } else {
    // 15th-EOM period
    return {
      start: addDays(startOfMonth(today), 14),
      end: endOfMonth(today),
    };
  }
}
