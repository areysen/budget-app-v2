-- Create savings_contributions table
CREATE TABLE IF NOT EXISTS savings_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  savings_goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  paycheck_period_id UUID NOT NULL REFERENCES paycheck_periods(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('planned', 'overflow', 'roundup')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Add RLS policies
ALTER TABLE savings_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their household's savings contributions"
  ON savings_contributions FOR SELECT
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert savings contributions for their household"
  ON savings_contributions FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their household's savings contributions"
  ON savings_contributions FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their household's savings contributions"
  ON savings_contributions FOR DELETE
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON savings_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX savings_contributions_household_id_idx ON savings_contributions(household_id);
CREATE INDEX savings_contributions_savings_goal_id_idx ON savings_contributions(savings_goal_id);
CREATE INDEX savings_contributions_paycheck_period_id_idx ON savings_contributions(paycheck_period_id);
CREATE INDEX savings_contributions_contribution_type_idx ON savings_contributions(contribution_type);

-- Add function to update savings goal balance
CREATE OR REPLACE FUNCTION update_savings_goal_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE savings_goals
    SET current_balance = current_balance + NEW.amount,
        updated_at = now(),
        updated_by = NEW.created_by
    WHERE id = NEW.savings_goal_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE savings_goals
    SET current_balance = current_balance - OLD.amount,
        updated_at = now(),
        updated_by = auth.uid()
    WHERE id = OLD.savings_goal_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE savings_goals
    SET current_balance = current_balance - OLD.amount + NEW.amount,
        updated_at = now(),
        updated_by = NEW.updated_by
    WHERE id = NEW.savings_goal_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to maintain savings goal balance
CREATE TRIGGER maintain_savings_goal_balance
  AFTER INSERT OR UPDATE OR DELETE ON savings_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_savings_goal_balance(); 