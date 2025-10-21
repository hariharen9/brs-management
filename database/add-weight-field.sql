-- Add weight field to transactions table
ALTER TABLE transactions 
ADD COLUMN weight_kg DECIMAL(10,3) DEFAULT NULL;

-- Add comment for the new field
COMMENT ON COLUMN transactions.weight_kg IS 'Weight in kilograms for both received and delivered transactions';