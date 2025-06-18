-- Add household_id, created_by, and updated_by columns to savings_contributions
ALTER TABLE savings_contributions
ADD COLUMN household_id UUID REFERENCES households(id),
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

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
CREATE INDEX IF NOT EXISTS savings_contributions_household_id_idx ON savings_contributions(household_id);
CREATE INDEX IF NOT EXISTS savings_contributions_goal_id_idx ON savings_contributions(goal_id);
CREATE INDEX IF NOT EXISTS savings_contributions_period_id_idx ON savings_contributions(period_id);
CREATE INDEX IF NOT EXISTS savings_contributions_contribution_type_idx ON savings_contributions(contribution_type);

-- Add function to update savings goal balance
CREATE OR REPLACE FUNCTION update_savings_goal_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE savings_goals
    SET current_balance = current_balance + NEW.amount,
        updated_at = now(),
        updated_by = NEW.created_by
    WHERE id = NEW.goal_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE savings_goals
    SET current_balance = current_balance - OLD.amount,
        updated_at = now(),
        updated_by = auth.uid()
    WHERE id = OLD.goal_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE savings_goals
    SET current_balance = current_balance - OLD.amount + NEW.amount,
        updated_at = now(),
        updated_by = NEW.updated_by
    WHERE id = NEW.goal_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to maintain savings goal balance
CREATE TRIGGER maintain_savings_goal_balance
  AFTER INSERT OR UPDATE OR DELETE ON savings_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_savings_goal_balance(); 