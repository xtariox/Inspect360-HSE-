-- Debug User Roles Issue
-- Run this in Supabase SQL Editor to check current user roles and fix any issues

-- 1. Check all user profiles and their roles
SELECT 
  email,
  role,
  status,
  created_at,
  approved_at
FROM user_profiles 
ORDER BY created_at;

-- 2. Check if there are any inconsistencies with admin users
SELECT 
  email,
  role,
  status,
  CASE 
    WHEN email = 'admin@ocp.com' AND role != 'admin' THEN '❌ WRONG ROLE'
    WHEN email = 'admin@ocp.com' AND role = 'admin' THEN '✅ CORRECT ROLE'
    WHEN email != 'admin@ocp.com' AND role = 'admin' THEN '⚠️ NON-ADMIN EMAIL WITH ADMIN ROLE'
    ELSE '✅ OK'
  END as status_check
FROM user_profiles;

-- 3. Fix admin role if needed
UPDATE user_profiles 
SET 
  role = 'admin',
  status = 'approved',
  approved_at = NOW()
WHERE email = 'admin@ocp.com' AND role != 'admin';

-- 4. Fix any non-admin emails that have admin role (if they shouldn't)
-- Uncomment the lines below if you want to reset inspector users to inspector role
-- UPDATE user_profiles 
-- SET role = 'inspector'
-- WHERE email != 'admin@ocp.com' AND role = 'admin';

-- 5. Check results after fix
SELECT 
  email,
  role,
  status,
  'FIXED' as note
FROM user_profiles 
ORDER BY created_at;
