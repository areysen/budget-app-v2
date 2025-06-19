"use client";

import React, { useMemo } from "react";
import { FrequencyType, FrequencyConfig } from "@/types/frequency";
import { frequencyCalculator } from "@/lib/services/frequency-calculator";

interface FrequencyPreviewProps {
  frequencyType: FrequencyType | null;
  frequencyConfig: FrequencyConfig | null;
  className?: string;
  showNextCount?: number;
}

export function FrequencyPreview({
  frequencyType,
  frequencyConfig,
  className = "",
  showNextCount = 3,
}: FrequencyPreviewProps) {
  const nextDueDates = useMemo(() => {
    if (!frequencyType || !frequencyConfig) return [];

    // Skip per-paycheck calculations as paycheck periods aren't set up yet
    if (frequencyType === "per_paycheck") {
      return [];
    }

    const dates = [];
    let currentDate = new Date();

    try {
      for (let i = 0; i < showNextCount; i++) {
        const nextDate = frequencyCalculator.calculateNextOccurrence({
          id: "temp",
          frequency_type: frequencyType,
          frequency_config: frequencyConfig,
          anchor_date: null,
        } as any);

        dates.push(new Date(nextDate));

        // Move past this occurrence for next calculation
        currentDate = new Date(nextDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (error) {
      console.error("Error calculating frequency preview:", error);
      return [];
    }

    return dates;
  }, [frequencyType, frequencyConfig, showNextCount]);

  if (!frequencyType || !frequencyConfig) {
    return null;
  }

  // For per-paycheck items, show a helpful message
  if (frequencyType === "per_paycheck") {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        <span className="font-medium">Next due:</span> Will be calculated when
        paycheck periods are set up
      </div>
    );
  }

  if (nextDueDates.length === 0) {
    return null;
  }

  return (
    <div className={`text-xs text-muted-foreground ${className}`}>
      <span className="font-medium">Next due:</span>{" "}
      {nextDueDates.map((date, index) => (
        <span key={index}>
          {date.toLocaleDateString()}
          {index < nextDueDates.length - 1 ? ", " : ""}
        </span>
      ))}
    </div>
  );
}
