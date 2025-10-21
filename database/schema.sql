-- BRS Management System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  dc_no TEXT NOT NULL,
  component TEXT NOT NULL,
  lot_no TEXT NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('Received', 'Delivered')),
  qty_in DECIMAL(10,2),
  qty_out DECIMAL(10,2),
  work_type TEXT CHECK (work_type IN ('Fettling', 'Shot Blasting', 'Both')),
  unit TEXT CHECK (unit IN ('Per Piece', 'Per Kg')),
  rate_applied DECIMAL(10,2),
  billed_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rates table
CREATE TABLE rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  component TEXT NOT NULL,
  work_type TEXT NOT NULL CHECK (work_type IN ('Fettling', 'Shot Blasting', 'Both')),
  unit TEXT NOT NULL CHECK (unit IN ('Per Piece', 'Per Kg')),
  rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, component, work_type, unit)
);

-- Indexes for better performance
CREATE INDEX idx_transactions_client_id ON transactions(client_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_rates_client_id ON rates(client_id);
CREATE INDEX idx_rates_lookup ON rates(client_id, component, work_type, unit);

-- RPC function for balance summary
CREATE OR REPLACE FUNCTION get_balance_summary(client_id UUID)
RETURNS TABLE (
  component TEXT,
  lot_no TEXT,
  total_in DECIMAL,
  total_out DECIMAL,
  balance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.component,
    t.lot_no,
    COALESCE(SUM(t.qty_in), 0) as total_in,
    COALESCE(SUM(t.qty_out), 0) as total_out,
    COALESCE(SUM(t.qty_in), 0) - COALESCE(SUM(t.qty_out), 0) as balance
  FROM transactions t 
  WHERE t.client_id = get_balance_summary.client_id 
  GROUP BY t.component, t.lot_no
  ORDER BY t.component, t.lot_no;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;

-- Authentication-based policies (only authenticated users can access data)
CREATE POLICY "Authenticated users can manage clients" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage transactions" ON transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage rates" ON rates FOR ALL USING (auth.role() = 'authenticated');

-- Sample data for development
INSERT INTO clients (name, contact_person) VALUES 
  ('ABC Manufacturing', 'John Smith'),
  ('XYZ Industries', 'Jane Doe'),
  ('PQR Components', 'Mike Johnson');

-- Sample rates (default rates with client_id = NULL)
INSERT INTO rates (client_id, component, work_type, unit, rate) VALUES 
  (NULL, 'Steel Bracket', 'Shot Blasting', 'Per Piece', 25.00),
  (NULL, 'Steel Bracket', 'Fettling', 'Per Piece', 15.00),
  (NULL, 'Steel Bracket', 'Both', 'Per Piece', 35.00),
  (NULL, 'Cast Iron Part', 'Shot Blasting', 'Per Kg', 8.00),
  (NULL, 'Cast Iron Part', 'Fettling', 'Per Kg', 5.00),
  (NULL, 'Cast Iron Part', 'Both', 'Per Kg', 12.00);

-- Sample transactions
INSERT INTO transactions (client_id, date, dc_no, component, lot_no, transaction_type, qty_in, qty_out, work_type, unit, rate_applied, billed_amount) 
SELECT 
  c.id,
  CURRENT_DATE - INTERVAL '5 days',
  'DC001',
  'Steel Bracket',
  'LOT001',
  'Received',
  100,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
FROM clients c WHERE c.name = 'ABC Manufacturing'
LIMIT 1;

INSERT INTO transactions (client_id, date, dc_no, component, lot_no, transaction_type, qty_in, qty_out, work_type, unit, rate_applied, billed_amount) 
SELECT 
  c.id,
  CURRENT_DATE - INTERVAL '3 days',
  'DC002',
  'Steel Bracket',
  'LOT001',
  'Delivered',
  NULL,
  80,
  'Shot Blasting',
  'Per Piece',
  25.00,
  2000.00
FROM clients c WHERE c.name = 'ABC Manufacturing'
LIMIT 1;