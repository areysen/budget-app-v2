# Frequency System Documentation

## Overview

The enhanced frequency calculation system supports complex recurring patterns for fixed expenses and income sources. This system replaces the simple frequency columns with a flexible JSON-based configuration that supports multiple frequency types.

## Frequency Types Supported

### 1. Monthly

- **Config**: `{ type: 'monthly', day_of_month: number, is_end_of_month: boolean }`
- **Examples**:
  - Rent on the 1st: `{ type: 'monthly', day_of_month: 1, is_end_of_month: false }`
  - Utilities on EOM: `{ type: 'monthly', day_of_month: null, is_end_of_month: true }`

### 2. Biweekly

- **Config**: `{ type: 'biweekly', day_of_week: string }`
- **Examples**:
  - Paycheck every other Friday: `{ type: 'biweekly', day_of_week: 'friday' }`
- **Note**: Requires `anchor_date` to establish the starting point

### 3. Weekly

- **Config**: `{ type: 'weekly', day_of_week: string }`
- **Examples**:
  - Grocery shopping every Sunday: `{ type: 'weekly', day_of_week: 'sunday' }`

### 4. Semi-monthly

- **Config**: `{ type: 'semi_monthly', first_day: number, second_day: number | null, second_is_eom: boolean }`
- **Examples**:
  - Mortgage on 1st and 15th: `{ type: 'semi_monthly', first_day: 1, second_day: 15, second_is_eom: false }`
  - Paycheck on 1st and EOM: `{ type: 'semi_monthly', first_day: 1, second_day: null, second_is_eom: true }`

### 5. Quarterly

- **Config**: `{ type: 'quarterly', quarterly_type: 'regular' | 'custom', day_of_month?: number, custom_dates?: string[] }`
- **Examples**:
  - Insurance on 15th of each quarter: `{ type: 'quarterly', quarterly_type: 'regular', day_of_month: 15 }`
  - Custom quarterly dates: `{ type: 'quarterly', quarterly_type: 'custom', custom_dates: ['03-15', '06-18', '09-19', '12-09'] }`

### 6. Yearly

- **Config**: `{ type: 'yearly', month: number, day: number }`
- **Examples**:
  - Property tax on November 15th: `{ type: 'yearly', month: 11, day: 15 }`

### 7. Per-paycheck

- **Config**: `{ type: 'per_paycheck', trigger: 'period_start' | 'pay_date' }`
- **Examples**:
  - Savings contribution at period start: `{ type: 'per_paycheck', trigger: 'period_start' }`

## Usage Examples

### Creating Frequency Configurations

```typescript
import { createFrequencyConfig } from "@/lib/utils/frequency-helpers";

// Monthly rent on the 1st
const rentConfig = createFrequencyConfig.monthly(1);

// Biweekly paycheck on Fridays
const paycheckConfig = createFrequencyConfig.biweekly("friday", "2024-01-05");

// Semi-monthly mortgage on 1st and 15th
const mortgageConfig = createFrequencyConfig.semiMonthly(1, 15);

// Quarterly insurance on 15th of each quarter
const insuranceConfig = createFrequencyConfig.quarterly("regular", 15);

// Yearly property tax on November 15th
const taxConfig = createFrequencyConfig.yearly(11, 15);

// Per-paycheck savings contribution
const savingsConfig = createFrequencyConfig.perPaycheck("period_start");
```

### Calculating Next Occurrences

```typescript
import { frequencyCalculator } from "@/lib/services/frequency-calculator";

const fixedExpense = {
  id: "rent-1",
  name: "Rent",
  amount: 1500,
  frequency_type: "monthly",
  frequency_config: createFrequencyConfig.monthly(1),
  anchor_date: null,
  // ... other required fields
};

const nextDueDate = frequencyCalculator.calculateNextOccurrence(
  fixedExpense,
  new Date("2024-01-15")
);
console.log(`Next rent due: ${nextDueDate.toDateString()}`);
```

### Getting All Occurrences in a Period

```typescript
const occurrences = frequencyCalculator.getOccurrencesInPeriod(
  fixedExpense,
  new Date("2024-01-01"),
  new Date("2024-03-31")
);

console.log(
  "Q1 2024 rent due dates:",
  occurrences.map((d) => d.toDateString())
);
```

### Per-paycheck Items

```typescript
const paycheckPeriods = [
  { start_date: "2024-01-01", end_date: "2024-01-14" },
  { start_date: "2024-01-15", end_date: "2024-01-31" },
];

const occurrences = frequencyCalculator.getOccurrencesInPeriod(
  savingsContribution,
  new Date("2024-01-01"),
  new Date("2024-01-31"),
  paycheckPeriods
);
```

## Database Schema

The frequency system uses these columns in the `fixed_expenses` and `income_sources` tables:

```sql
frequency_type TEXT,           -- 'monthly', 'biweekly', etc.
frequency_config JSONB,        -- Configuration object
anchor_date DATE,              -- For biweekly items
next_due_date DATE             -- Calculated next occurrence
```

## Integration Points

### 1. Fixed Expense Creation

When creating a fixed expense, use the frequency helpers:

```typescript
const newExpense = {
  name: "Rent",
  amount: 1500,
  frequency_type: "monthly",
  frequency_config: createFrequencyConfig.monthly(1),
  anchor_date: null,
  household_id: "household-1",
};
```

### 2. Period Generation

When generating paycheck periods, calculate which items appear in each period:

```typescript
const periodItems = fixedExpenses.map((expense) => {
  const occurrences = frequencyCalculator.getOccurrencesInPeriod(
    expense,
    periodStartDate,
    periodEndDate
  );

  return {
    expense,
    occurrences,
    totalAmount: expense.amount * occurrences.length,
  };
});
```

### 3. Budget Planning

Show upcoming due dates in budget planning components:

```typescript
const upcomingItems = fixedExpenses.map((expense) => ({
  ...expense,
  nextDue: frequencyCalculator.calculateNextOccurrence(expense),
}));
```

## Validation

Use the validation helper to ensure frequency configurations are correct:

```typescript
import { validateFrequencyConfig } from "@/lib/utils/frequency-helpers";

const isValid = validateFrequencyConfig("monthly", {
  type: "monthly",
  day_of_month: 15,
  is_end_of_month: false,
});
```

## Display Formatting

Format frequency configurations for user display:

```typescript
import { formatFrequencyDisplay } from "@/lib/utils/frequency-helpers";

const displayText = formatFrequencyDisplay("monthly", {
  type: "monthly",
  day_of_month: 15,
  is_end_of_month: false,
});
// Returns: "Monthly (15th)"
```

## Migration from Old System

The old frequency columns (`frequency`, `due_day`, `schedule_type`) remain in the database for backward compatibility. New records should use the enhanced frequency system.

### Migration Strategy

1. **New records**: Use enhanced frequency system
2. **Existing records**: Can be migrated gradually
3. **Display**: Show both old and new frequency information during transition

### Migration Helper

```typescript
function migrateOldFrequency(oldRecord: any) {
  switch (oldRecord.schedule_type) {
    case "monthly":
      return createFrequencyConfig.monthly(oldRecord.due_day);
    case "biweekly":
      return createFrequencyConfig.biweekly(
        oldRecord.bi_weekly_day,
        oldRecord.bi_weekly_start_date
      );
    // ... handle other cases
  }
}
```

## Error Handling

The frequency calculator includes comprehensive error handling:

- **Missing config**: Throws "Frequency config is required"
- **Invalid frequency type**: Throws "Unsupported frequency type: {type}"
- **Missing anchor date**: Throws "Anchor date is required for biweekly frequency"
- **Per-paycheck without periods**: Throws "Per-paycheck items require paycheck period context"

## Testing

The frequency system includes comprehensive examples in `src/lib/services/frequency-calculator-examples.ts` that demonstrate all frequency types and edge cases.

## Performance Considerations

- **Caching**: Consider caching calculated dates for frequently accessed items
- **Batch calculations**: Use `getOccurrencesInPeriod` for bulk date calculations
- **Date ranges**: Limit date ranges to reasonable periods (e.g., 1 year) to avoid infinite loops

## Future Enhancements

Potential improvements to consider:

1. **Custom frequencies**: Allow user-defined patterns
2. **Skip dates**: Support for skipping specific occurrences
3. **Variable amounts**: Support for frequency-based amount changes
4. **Notifications**: Integration with notification system for upcoming due dates
5. **Calendar integration**: Export frequency items to calendar applications
