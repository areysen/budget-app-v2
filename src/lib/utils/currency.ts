/**
 * Format a number as currency with proper locale and currency symbol
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse a currency string into a number
 * Handles various input formats: "$1,234.56", "1234.56", "1,234.56"
 */
export function parseCurrency(input: string): number {
  // Remove currency symbol and commas
  const cleanInput = input.replace(/[$,]/g, "");
  const parsed = parseFloat(cleanInput);

  if (isNaN(parsed)) {
    throw new Error("Invalid currency format");
  }

  return parsed;
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Calculate the percentage of a value relative to a total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Round a number to the nearest cent
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate the difference between two amounts
 * Returns a positive number for increase, negative for decrease
 */
export function calculateDifference(current: number, previous: number): number {
  return roundToCents(current - previous);
}

/**
 * Format a currency difference with + or - prefix
 */
export function formatCurrencyDifference(difference: number): string {
  const prefix = difference >= 0 ? "+" : "";
  return `${prefix}${formatCurrency(difference)}`;
}
