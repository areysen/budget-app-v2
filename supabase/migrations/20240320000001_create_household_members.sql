-- Create household_members table
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  can_edit_budget BOOLEAN NOT NULL DEFAULT false,
  can_approve_transactions BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(household_id, user_id)
);

-- Enable RLS
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their household memberships"
  ON household_members FOR SELECT
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert household members"
  ON household_members FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

CREATE POLICY "Users can update household members"
  ON household_members FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

CREATE POLICY "Users can delete household members"
  ON household_members FOR DELETE
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON household_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS household_members_household_id_idx ON household_members(household_id);
CREATE INDEX IF NOT EXISTS household_members_user_id_idx ON household_members(user_id);
CREATE INDEX IF NOT EXISTS household_members_role_idx ON household_members(role);

-- Create function to automatically add creator as owner
CREATE OR REPLACE FUNCTION add_household_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO household_members (household_id, user_id, role, can_edit_budget, can_approve_transactions)
  VALUES (NEW.id, NEW.created_by, 'owner', true, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to add creator as owner
CREATE TRIGGER add_household_owner_trigger
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION add_household_owner(); 