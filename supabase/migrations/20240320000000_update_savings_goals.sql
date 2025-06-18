-- Add created_by and updated_by columns to savings_goals
ALTER TABLE savings_goals
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Add RLS policies
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their household's savings goals"
  ON savings_goals FOR SELECT
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert savings goals for their household"
  ON savings_goals FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their household's savings goals"
  ON savings_goals FOR UPDATE
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

CREATE POLICY "Users can delete their household's savings goals"
  ON savings_goals FOR DELETE
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX IF NOT EXISTS savings_goals_household_id_idx ON savings_goals(household_id);
CREATE INDEX IF NOT EXISTS savings_goals_is_active_idx ON savings_goals(is_active);
CREATE INDEX IF NOT EXISTS savings_goals_is_emergency_fund_idx ON savings_goals(is_emergency_fund);
CREATE INDEX IF NOT EXISTS savings_goals_is_roundup_target_idx ON savings_goals(is_roundup_target); 