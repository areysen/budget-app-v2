"use client";

import React from "react";
import {
  createFrequencyConfig,
  formatFrequencyDisplay,
} from "@/lib/utils/frequency-helpers";
import { frequencyCalculator } from "@/lib/services/frequency-calculator";

export default function TestPage() {
  const testFrequencies = () => {
    console.log("=== Testing Enhanced Frequency System ===");

    // Test 1: Monthly rent on the 1st
    const rentConfig = createFrequencyConfig.monthly(1);
    console.log(
      "Rent frequency:",
      formatFrequencyDisplay("monthly", rentConfig)
    );

    // Test 2: Biweekly paycheck on Fridays
    const paycheckConfig = createFrequencyConfig.biweekly(
      "friday",
      "2024-01-05"
    );
    console.log(
      "Paycheck frequency:",
      formatFrequencyDisplay("biweekly", paycheckConfig)
    );

    // Test 3: Semi-monthly mortgage on 1st and 15th
    const mortgageConfig = createFrequencyConfig.semiMonthly(1, 15);
    console.log(
      "Mortgage frequency:",
      formatFrequencyDisplay("semi_monthly", mortgageConfig)
    );

    // Test 4: Quarterly insurance on 15th of each quarter
    const insuranceConfig = createFrequencyConfig.quarterly("regular", 15);
    console.log(
      "Insurance frequency:",
      formatFrequencyDisplay("quarterly", insuranceConfig)
    );

    // Test 5: Yearly property tax on November 15th
    const taxConfig = createFrequencyConfig.yearly(11, 15);
    console.log(
      "Property tax frequency:",
      formatFrequencyDisplay("yearly", taxConfig)
    );

    // Test 6: Per-paycheck savings contribution
    const savingsConfig = createFrequencyConfig.perPaycheck("period_start");
    console.log(
      "Savings frequency:",
      formatFrequencyDisplay("per_paycheck", savingsConfig)
    );

    // Test next occurrence calculations
    const testExpense = {
      id: "test-1",
      name: "Test Rent",
      amount: 1500,
      frequency_type: "monthly" as const,
      frequency_config: rentConfig,
      anchor_date: null,
    };

    const nextDueDate = frequencyCalculator.calculateNextOccurrence(
      testExpense as any
    );
    console.log("Next rent due:", nextDueDate.toDateString());

    // Test occurrences in period
    const occurrences = frequencyCalculator.getOccurrencesInPeriod(
      testExpense as any,
      new Date("2024-01-01"),
      new Date("2024-03-31")
    );
    console.log(
      "Q1 2024 rent due dates:",
      occurrences.map((d) => d.toDateString())
    );
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        Enhanced Frequency System Test
      </h1>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">
            Frequency System Features
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>✅ Monthly (with day of month or end of month)</li>
            <li>✅ Biweekly (with day of week and anchor date)</li>
            <li>✅ Weekly (with day of week)</li>
            <li>✅ Semi-monthly (with two days per month)</li>
            <li>✅ Quarterly (regular or custom dates)</li>
            <li>✅ Yearly (with month and day)</li>
            <li>✅ Per-paycheck (period start or pay date)</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Integration Status</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>✅ TypeScript types implemented</li>
            <li>✅ Frequency calculator service created</li>
            <li>✅ Helper utilities implemented</li>
            <li>✅ Fixed Expenses form updated</li>
            <li>✅ API route updated</li>
            <li>✅ Database schema supports new fields</li>
          </ul>
        </div>

        <button
          onClick={testFrequencies}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Frequency System (Check Console)
        </button>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Next Steps</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>🔄 Test the form in the budget setup flow</li>
            <li>🔄 Verify database saves correctly</li>
            <li>🔄 Test frequency calculations in period generation</li>
            <li>🔄 Update dashboard to show enhanced frequency info</li>
            <li>🔄 Add frequency system to income sources</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
