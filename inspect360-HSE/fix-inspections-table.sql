-- Fix inspections table to add missing columns
-- Execute this in your Supabase SQL editor

-- Add missing columns to inspections table
ALTER TABLE inspections 
ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS template JSONB DEFAULT '{}';

-- Update any existing records to have proper default values
UPDATE inspections 
SET sections = '[]'::jsonb 
WHERE sections IS NULL;

UPDATE inspections 
SET template = '{}'::jsonb 
WHERE template IS NULL;

-- Refresh the schema cache to ensure new columns are recognized
NOTIFY pgrst, 'reload schema';
