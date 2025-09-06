-- ===============================================
-- CLEANUP REDUNDANT TEMPLATES SCRIPT
-- ===============================================
-- Run this script FIRST to clean up duplicate templates
-- before running the main setup script
-- ===============================================

-- 1. REMOVE ALL DUPLICATE TEMPLATES
-- ===============================================

-- Check current templates (for reference)
SELECT 
  id,
  title,
  category,
  is_prebuilt,
  created_at,
  jsonb_array_length(sections) as section_count
FROM templates 
ORDER BY title, created_at;

-- Remove all corrupted templates (empty sections)
DELETE FROM templates 
WHERE sections = '[]'::jsonb 
   OR sections IS NULL 
   OR jsonb_array_length(sections) = 0;

-- Remove all duplicate prebuilt templates
-- Keep only the most recent version of each unique template
DELETE FROM templates 
WHERE id NOT IN (
  SELECT DISTINCT ON (title, category, is_prebuilt) id
  FROM templates 
  WHERE is_prebuilt = true
  ORDER BY title, category, is_prebuilt, created_at DESC
);

-- Alternative: Remove ALL prebuilt templates (if you want a fresh start)
-- Uncomment the line below if you want to remove everything and start fresh
-- DELETE FROM templates WHERE is_prebuilt = true;

-- 2. VERIFY CLEANUP
-- ===============================================

-- Check remaining templates after cleanup
SELECT 
  id,
  title,
  category,
  is_prebuilt,
  created_at,
  jsonb_array_length(sections) as section_count
FROM templates 
ORDER BY title, created_at;

-- Count templates by type
SELECT 
  is_prebuilt,
  COUNT(*) as template_count
FROM templates 
GROUP BY is_prebuilt;

-- ===============================================
-- CLEANUP COMPLETE!
-- ===============================================
-- Now run the main complete-supabase-setup.sql script
-- to create fresh, clean templates
-- ===============================================
