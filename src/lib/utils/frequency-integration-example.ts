/**
 * Frequency System Integration Example
 *
 * This file demonstrates how the frequency system integrates with the budget setup flow
 * and other parts of the application.
 */

import {
  createFrequencyConfig,
  formatFrequencyDisplay,
} from "./frequency-helpers";
import { frequencyCalculator } from "../services/frequency-calculator";

// Example: Creating a fixed expense during budget setup
export function createFixedExpenseExample() {
  const rentExpense = {
    name: "Rent",
    amount: 1500,
    frequency_type: "monthly" as const,
    frequency_config: createFrequencyConfig.monthly(1), // 1st of each month
    anchor_date: null,
    household_id: "household-1",
  };

  // Calculate next due date for display
  const nextDueDate = frequencyCalculator.calculateNextOccurrence(
    rentExpense as any,
    new Date()
  );

  console.log(`Created expense: ${rentExpense.name}`);
  console.log(`Amount: $${rentExpense.amount}`);
  console.log(
    `Frequency: ${formatFrequencyDisplay(
      "monthly",
      rentExpense.frequency_config
    )}`
  );
  console.log(`Next due: ${nextDueDate.toDateString()}`);

  return rentExpense;
}

// Example: Creating an income source during budget setup
export function createIncomeSourceExample() {
  const paycheckIncome = {
    name: "Primary Job Paycheck",
    amount: 2000,
    frequency_type: "biweekly" as const,
    frequency_config: createFrequencyConfig.biweekly("friday", "2024-01-05"),
    anchor_date: "2024-01-05",
    household_id: "household-1",
  };

  const nextPayDate = frequencyCalculator.calculateNextOccurrence(
    paycheckIncome as any,
    new Date()
  );

  console.log(`Created income: ${paycheckIncome.name}`);
  console.log(`Amount: $${paycheckIncome.amount}`);
  console.log(
    `Frequency: ${formatFrequencyDisplay(
      "biweekly",
      paycheckIncome.frequency_config
    )}`
  );
  console.log(`Next pay date: ${nextPayDate.toDateString()}`);

  return paycheckIncome;
}

// Example: Calculating period allocations
export function calculatePeriodAllocationsExample() {
  const fixedExpenses = [
    {
      id: "rent-1",
      name: "Rent",
      amount: 1500,
      frequency_type: "monthly" as const,
      frequency_config: createFrequencyConfig.monthly(1),
      anchor_date: null,
    },
    {
      id: "mortgage-1",
      name: "Mortgage",
      amount: 1200,
      frequency_type: "semi_monthly" as const,
      frequency_config: createFrequencyConfig.semiMonthly(1, 15),
      anchor_date: null,
    },
    {
      id: "insurance-1",
      name: "Car Insurance",
      amount: 300,
      frequency_type: "quarterly" as const,
      frequency_config: createFrequencyConfig.quarterly("regular", 15),
      anchor_date: null,
    },
  ];

  const periodStart = new Date("2024-01-01");
  const periodEnd = new Date("2024-01-31");

  const periodAllocations = fixedExpenses.map((expense) => {
    const occurrences = frequencyCalculator.getOccurrencesInPeriod(
      expense as any,
      periodStart,
      periodEnd
    );

    return {
      expense: expense.name,
      occurrences: occurrences.length,
      totalAmount: expense.amount * occurrences.length,
      dueDates: occurrences.map((d) => d.toDateString()),
    };
  });

  console.log("Period Allocations (January 2024):");
  periodAllocations.forEach((allocation) => {
    console.log(
      `${allocation.expense}: $${allocation.totalAmount} (${allocation.occurrences} occurrence(s))`
    );
    if (allocation.dueDates.length > 0) {
      console.log(`  Due dates: ${allocation.dueDates.join(", ")}`);
    }
  });

  return periodAllocations;
}

// Example: Upcoming due dates for dashboard
export function getUpcomingDueDatesExample() {
  const fixedExpenses = [
    {
      id: "rent-1",
      name: "Rent",
      amount: 1500,
      frequency_type: "monthly" as const,
      frequency_config: createFrequencyConfig.monthly(1),
      anchor_date: null,
    },
    {
      id: "mortgage-1",
      name: "Mortgage",
      amount: 1200,
      frequency_type: "semi_monthly" as const,
      frequency_config: createFrequencyConfig.semiMonthly(1, 15),
      anchor_date: null,
    },
  ];

  const today = new Date();
  const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const upcomingItems = fixedExpenses
    .map((expense) => {
      const nextDue = frequencyCalculator.calculateNextOccurrence(
        expense as any,
        today
      );

      return {
        name: expense.name,
        amount: expense.amount,
        nextDue,
        daysUntilDue: Math.ceil(
          (nextDue.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
        ),
        frequency: formatFrequencyDisplay(
          expense.frequency_type,
          expense.frequency_config
        ),
      };
    })
    .filter((item) => item.nextDue <= next30Days)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  console.log("Upcoming Due Dates (Next 30 Days):");
  upcomingItems.forEach((item) => {
    console.log(
      `${item.name}: $${item.amount} due in ${
        item.daysUntilDue
      } days (${item.nextDue.toDateString()})`
    );
    console.log(`  Frequency: ${item.frequency}`);
  });

  return upcomingItems;
}

// Example: Per-paycheck savings contributions
export function calculateSavingsContributionsExample() {
  const savingsGoals = [
    {
      id: "emergency-fund",
      name: "Emergency Fund",
      target_amount: 10000,
      current_amount: 5000,
      contribution_amount: 200,
      frequency_type: "per_paycheck" as const,
      frequency_config: createFrequencyConfig.perPaycheck("period_start"),
      anchor_date: null,
    },
  ];

  const paycheckPeriods = [
    { start_date: "2024-01-01", end_date: "2024-01-14" },
    { start_date: "2024-01-15", end_date: "2024-01-31" },
    { start_date: "2024-02-01", end_date: "2024-02-14" },
  ];

  const contributions = savingsGoals.map((goal) => {
    const occurrences = frequencyCalculator.getOccurrencesInPeriod(
      goal as any,
      new Date("2024-01-01"),
      new Date("2024-02-14"),
      paycheckPeriods
    );

    return {
      goal: goal.name,
      contributionAmount: goal.contribution_amount,
      totalContributions: goal.contribution_amount * occurrences.length,
      contributionDates: occurrences.map((d) => d.toDateString()),
      progress: `${
        goal.current_amount + goal.contribution_amount * occurrences.length
      } / ${goal.target_amount}`,
    };
  });

  console.log("Savings Contributions (Jan-Feb 2024):");
  contributions.forEach((contribution) => {
    console.log(
      `${contribution.goal}: $${contribution.totalContributions} total`
    );
    console.log(`  Per contribution: $${contribution.contributionAmount}`);
    console.log(
      `  Contribution dates: ${contribution.contributionDates.join(", ")}`
    );
    console.log(`  Progress: ${contribution.progress}`);
  });

  return contributions;
}

// Run all examples
export function runIntegrationExamples() {
  console.log("=== Frequency System Integration Examples ===\n");

  console.log("1. Creating Fixed Expense:");
  createFixedExpenseExample();

  console.log("\n2. Creating Income Source:");
  createIncomeSourceExample();

  console.log("\n3. Calculating Period Allocations:");
  calculatePeriodAllocationsExample();

  console.log("\n4. Getting Upcoming Due Dates:");
  getUpcomingDueDatesExample();

  console.log("\n5. Calculating Savings Contributions:");
  calculateSavingsContributionsExample();

  console.log("\n=== Integration Examples Complete ===");
}
