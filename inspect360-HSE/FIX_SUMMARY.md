# Fix for Draft Button and New Inspection Issues

## Issues Fixed:

### 1. Draft Button Error
**Problem**: Database schema error - "Could not find the 'sections' column of 'inspections' in the schema cache"

**Solution**: 
- Modified `inspectionsService.ts` to remove the `sections` field from database operations since it doesn't exist in the current schema
- Updated the mapping functions to handle missing columns gracefully

### 2. New Inspection Button in Assignments
**Problem**: Button was showing placeholder alerts instead of navigating to actual screens

**Solution**:
- Updated `AssignmentsScreen.tsx` to use proper navigation with `useNavigation` hook
- Added navigation to 'NewInspection' screen when "New Inspection" button is clicked
- Added navigation to 'InspectionForm' screen when inspections are accessed

## Files Modified:

1. **`services/inspectionsService.ts`**:
   - Removed `sections` field from `mapInspectionToSupabase()` method
   - Added default empty array for `sections` in `mapSupabaseToInspection()` method
   - Updated `saveDraft()` method to handle sections properly

2. **`screens/AssignmentsScreen.tsx`**:
   - Added `useNavigation` import and hook
   - Replaced Alert dialogs with actual navigation calls
   - Added proper navigation to 'NewInspection' and 'InspectionForm' screens

3. **`fix-inspections-table.sql`** (Optional Database Migration):
   - SQL script to add missing columns if you want to support them in the future

## Optional Database Migration

If you want to support the `sections` and `template` columns in the future, run this SQL in your Supabase SQL editor:

```sql
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
```

## Testing:

1. **Draft Button**: Try clicking the "Save as Draft" button in the inspection form - it should now work without database errors
2. **New Inspection Button**: In the Assignments screen, click "New Inspection" - it should navigate to the NewInspection screen instead of showing an alert
3. **Navigation**: Verify that proper navigation is working between screens

The fixes maintain backward compatibility and should resolve both issues immediately.
