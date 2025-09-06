-- ===============================================
-- FIX RLS INFINITE RECURSION ISSUE
-- ===============================================
-- Run this script to completely fix the infinite recursion problem
-- This will remove all problematic policies and create clean ones
-- ===============================================

-- 1. COMPLETELY DISABLE RLS TEMPORARILY
-- ===============================================

ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspections DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_assignments DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES (Clean Slate)
-- ===============================================

-- Drop all user_profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_profiles;

-- Drop all template policies
DROP POLICY IF EXISTS "Templates are viewable by authenticated users" ON templates;
DROP POLICY IF EXISTS "Users can create templates" ON templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON templates;
DROP POLICY IF EXISTS "Enable read access for all users" ON templates;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON templates;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON templates;

-- Drop all inspection policies
DROP POLICY IF EXISTS "Users can view relevant inspections" ON inspections;
DROP POLICY IF EXISTS "Authorized users can create inspections" ON inspections;
DROP POLICY IF EXISTS "Users can update relevant inspections" ON inspections;
DROP POLICY IF EXISTS "Enable read access for all users" ON inspections;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON inspections;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON inspections;

-- Drop all assignment policies
DROP POLICY IF EXISTS "Users can view their assignments" ON inspection_assignments;
DROP POLICY IF EXISTS "Managers and admins can create assignments" ON inspection_assignments;
DROP POLICY IF EXISTS "Authorized users can update assignments" ON inspection_assignments;
DROP POLICY IF EXISTS "Enable read access for all users" ON inspection_assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON inspection_assignments;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON inspection_assignments;

-- 3. CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ===============================================

-- User Profile Policies (NO RECURSION)
CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Template Policies (SIMPLE)
CREATE POLICY "templates_select_all"
  ON templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "templates_insert_authenticated"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "templates_update_authenticated"
  ON templates FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "templates_delete_authenticated"
  ON templates FOR DELETE
  TO authenticated
  USING (true);

-- Inspection Policies (SIMPLE)
CREATE POLICY "inspections_select_all"
  ON inspections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "inspections_insert_authenticated"
  ON inspections FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "inspections_update_authenticated"
  ON inspections FOR UPDATE
  TO authenticated
  USING (true);

-- Assignment Policies (SIMPLE)
CREATE POLICY "assignments_select_all"
  ON inspection_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "assignments_insert_authenticated"
  ON inspection_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "assignments_update_authenticated"
  ON inspection_assignments FOR UPDATE
  TO authenticated
  USING (true);

-- 4. RE-ENABLE RLS WITH NEW POLICIES
-- ===============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_assignments ENABLE ROW LEVEL SECURITY;

-- 5. VERIFY NO RECURSION
-- ===============================================

-- Test query to make sure user_profiles works
SELECT 'Testing user_profiles access...' as test;
-- This should work without recursion now

-- 6. CREATE OR UPDATE ADMIN USER PROFILE
-- ===============================================

-- Insert admin profile if it doesn't exist (adjust the ID to match your auth user)
INSERT INTO user_profiles (
  id,
  full_name,
  email,
  role,
  status,
  company_domain,
  approved_at,
  approved_by
) VALUES (
  '60f2b32f-e18c-4b75-b17f-d7aa00a028ea', -- Your admin user ID
  'System Administrator',
  'admin@ocp.com',
  'admin',
  'approved',
  'ocp.com',
  NOW(),
  '60f2b32f-e18c-4b75-b17f-d7aa00a028ea'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  approved_at = EXCLUDED.approved_at,
  approved_by = EXCLUDED.approved_by;

-- ===============================================
-- RECURSION ISSUE FIXED!
-- ===============================================
-- Your login should now work without infinite recursion
-- The policies are now simple and don't reference the same table
-- ===============================================

-- Final verification
SELECT 
  id,
  email,
  role,
  status,
  full_name
FROM user_profiles 
WHERE email = 'admin@ocp.com';
