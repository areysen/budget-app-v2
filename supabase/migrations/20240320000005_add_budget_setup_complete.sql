-- Add budget_setup_complete column to households table
ALTER TABLE households
ADD COLUMN budget_setup_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN households.budget_setup_complete IS 'Indicates whether the budget setup wizard has been completed for this household'; 