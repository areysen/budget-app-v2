-- Add budget_setup_complete column to households table
ALTER TABLE households
ADD COLUMN budget_setup_complete BOOLEAN NOT NULL DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS households_budget_setup_complete_idx ON households(budget_setup_complete); 