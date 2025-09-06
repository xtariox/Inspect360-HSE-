-- Debug script to check current prebuilt templates structure
-- Execute this in Supabase SQL editor to see what's in the database

-- Check if templates exist and their structure
SELECT 
  id,
  title,
  description,
  category,
  array_length(tags, 1) as tag_count,
  jsonb_array_length(sections) as section_count,
  is_prebuilt,
  created_at,
  sections
FROM templates 
WHERE is_prebuilt = true
ORDER BY created_at DESC;

-- Check for any malformed sections
SELECT 
  id,
  title,
  section_num,
  section_data
FROM templates,
LATERAL jsonb_array_elements_text(sections) WITH ORDINALITY AS t(section_data, section_num)
WHERE is_prebuilt = true
LIMIT 20;

-- Check specific field structure in first template
SELECT 
  title,
  sections->0->'fields' as first_section_fields
FROM templates 
WHERE is_prebuilt = true 
AND title = 'Safety Inspection Checklist'
LIMIT 1;
