-- Authentication Update Script
-- Run this to update existing database with authentication policies

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
DROP POLICY IF EXISTS "Allow all operations on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow all operations on rates" ON rates;

-- Create new authentication-based policies
CREATE POLICY "Authenticated users can manage clients" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage transactions" ON transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage rates" ON rates FOR ALL USING (auth.role() = 'authenticated');

-- Verify RLS is enabled (should already be enabled)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;