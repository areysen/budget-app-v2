-- Add pay schedule type to households table
ALTER TABLE households
ADD COLUMN pay_schedule_type text CHECK (pay_schedule_type IN ('semi-monthly', 'bi-weekly', 'monthly'));

-- Add comment to explain the field
COMMENT ON COLUMN households.pay_schedule_type IS 'The frequency of paychecks for the household (semi-monthly, bi-weekly, or monthly)'; 