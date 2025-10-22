-- Migration to update clients table schema
-- Replace contact_person with gst_number and add address field

-- Add new columns
ALTER TABLE clients 
ADD COLUMN gst_number TEXT,
ADD COLUMN address TEXT;

-- Copy existing contact_person data to gst_number (if you want to preserve it)
-- UPDATE clients SET gst_number = contact_person WHERE contact_person IS NOT NULL;

-- Drop the old contact_person column
ALTER TABLE clients DROP COLUMN contact_person;

-- Add comments for documentation
COMMENT ON COLUMN clients.gst_number IS 'GST registration number of the client company';
COMMENT ON COLUMN clients.address IS 'Physical address of the client company';