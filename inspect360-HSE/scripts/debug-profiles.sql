-- Debug script to check for profile issues
-- Run this in Supabase SQL Editor to diagnose user profile problems

-- 1. Check all auth users
SELECT 
  'AUTH USERS' as table_name,
  id,
  email,
  created_at,
  confirmed_at
FROM auth.users 
ORDER BY created_at;

-- 2. Check all user profiles
SELECT 
  'USER PROFILES' as table_name,
  id,
  email,
  full_name,
  role,
  status,
  created_at
FROM user_profiles 
ORDER BY created_at;

-- 3. Check for mismatched profiles (auth users without profiles)
SELECT 
  'MISSING PROFILES' as table_name,
  au.id,
  au.email,
  'Missing profile for auth user' as issue
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- 4. Check for orphaned profiles (profiles without auth users)
SELECT 
  'ORPHANED PROFILES' as table_name,
  up.id,
  up.email,
  'Profile exists but no auth user' as issue
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.id IS NULL;

-- 5. Check for email mismatches between auth and profiles
SELECT 
  'EMAIL MISMATCHES' as table_name,
  au.id,
  au.email as auth_email,
  up.email as profile_email,
  'Email mismatch between auth and profile' as issue
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
WHERE au.email != up.email;

-- 6. Check current admin user specifically
SELECT 
  'ADMIN CHECK' as table_name,
  au.id as auth_id,
  au.email as auth_email,
  up.id as profile_id,
  up.email as profile_email,
  up.role,
  up.status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'admin@ocp.com';
