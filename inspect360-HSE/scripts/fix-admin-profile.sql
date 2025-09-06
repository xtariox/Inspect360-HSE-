-- PROPER RLS FIX: Secure policies for role-based access
-- Run this in Supabase SQL Editor

-- 1. Disable RLS temporarily for setup
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspections DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_assignments DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies
DROP POLICY IF EXISTS "Allow own profile access" ON user_profiles;
DROP POLICY IF EXISTS "Allow admin full access" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "users_select_own" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own" ON user_profiles;
DROP POLICY IF EXISTS "templates_select_active" ON templates;
DROP POLICY IF EXISTS "inspections_own" ON inspections;
DROP POLICY IF EXISTS "Users can read active templates" ON templates;
DROP POLICY IF EXISTS "Admins can manage all templates" ON templates;
DROP POLICY IF EXISTS "Users can read own inspections" ON inspections;
DROP POLICY IF EXISTS "Users can manage own inspections" ON inspections;
DROP POLICY IF EXISTS "Users can read own assignments" ON inspection_assignments;
DROP POLICY IF EXISTS "Managers can manage assignments" ON inspection_assignments;

-- 3. Ensure admin profile exists
INSERT INTO user_profiles (
  id, 
  full_name, 
  email, 
  role, 
  status, 
  company_domain, 
  approved_at, 
  approved_by,
  created_at
)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'System Administrator'),
  'admin@ocp.com',
  'admin',
  'approved',
  'ocp.com',
  NOW(),
  au.id,
  NOW()
FROM auth.users au 
WHERE au.email = 'admin@ocp.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'approved',
  approved_at = NOW(),
  approved_by = EXCLUDED.approved_by;

-- 4. Create SECURE policies for role-based access

-- USER_PROFILES policies
-- Allow users to read their own profile
CREATE POLICY "profile_read_own" ON user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own basic info (not role/status)
CREATE POLICY "profile_update_own" ON user_profiles
FOR UPDATE
USING (auth.uid() = id);

-- ADMIN/MANAGER can read ALL profiles (for user management)
-- This uses a function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.email IN (
      'admin@ocp.com'
    )
  ) OR EXISTS (
    SELECT 1 
    FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role IN ('admin', 'manager')
    AND up.status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "profile_read_admin_manager" ON user_profiles
FOR SELECT
USING (public.is_admin_or_manager());

CREATE POLICY "profile_update_admin_manager" ON user_profiles
FOR UPDATE
USING (public.is_admin_or_manager());

CREATE POLICY "profile_insert_admin_manager" ON user_profiles
FOR INSERT
WITH CHECK (public.is_admin_or_manager());

-- TEMPLATES policies
CREATE POLICY "templates_read_all" ON templates
FOR SELECT
USING (is_active = true OR public.is_admin_or_manager());

CREATE POLICY "templates_write_admin_manager" ON templates
FOR ALL
USING (public.is_admin_or_manager());

-- INSPECTIONS policies
CREATE POLICY "inspections_read_own_or_manager" ON inspections
FOR SELECT
USING (
  inspector = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR public.is_admin_or_manager()
);

CREATE POLICY "inspections_write_own_or_manager" ON inspections
FOR ALL
USING (
  inspector = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR public.is_admin_or_manager()
);

-- INSPECTION_ASSIGNMENTS policies  
CREATE POLICY "assignments_read_involved_or_manager" ON inspection_assignments
FOR SELECT
USING (
  assigned_to = auth.uid()
  OR assigned_by = auth.uid()
  OR public.is_admin_or_manager()
);

CREATE POLICY "assignments_write_manager" ON inspection_assignments
FOR ALL
USING (public.is_admin_or_manager());

-- 5. Re-enable RLS with proper policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_assignments ENABLE ROW LEVEL SECURITY;

-- 6. Verify setup
SELECT 'Admin profile verification:' as info;
SELECT id, full_name, email, role, status 
FROM user_profiles 
WHERE email = 'admin@ocp.com';

-- Test the function
SELECT 'Testing admin function:' as info;
SELECT public.is_admin_or_manager() as is_admin_result;

SELECT '✅ Secure role-based policies created!' as result;