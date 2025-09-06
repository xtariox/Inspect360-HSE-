"ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspection_status TEXT DEFAULT 'draft'; ALTER TABLE templates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';" 
