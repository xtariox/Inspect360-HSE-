-- Fix Duplicate Profile Issues
-- Run this if you get "duplicate key value violates unique constraint" errors

-- 1. Check for duplicate profiles
SELECT email, COUNT(*) as count 
FROM user_profiles 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 2. If you have the test@ocp.com user causing issues, you can either:

-- Option A: Delete the duplicate profile (if you want to recreate it)
-- DELETE FROM user_profiles WHERE email = 'test@ocp.com';

-- Option B: Or update the existing profile to ensure it's properly set up
UPDATE user_profiles 
SET 
  role = 'inspector',
  status = 'pending',
  company_domain = SPLIT_PART(email, '@', 2),
  created_at = COALESCE(created_at, NOW())
WHERE email = 'test@ocp.com' AND status IS NULL;

-- 3. Re-run the updated trigger function to handle future duplicates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if profile doesn't already exist
  INSERT INTO public.user_profiles (
    id,
    full_name,
    email,
    role,
    status,
    company_domain,
    approved_at,
    approved_by
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    CASE 
      WHEN NEW.email = 'admin@ocp.com' THEN 'admin'
      WHEN NEW.raw_user_meta_data->>'role' = 'manager' THEN 'manager'
      ELSE 'inspector'
    END,
    CASE 
      WHEN NEW.email = 'admin@ocp.com' THEN 'approved'
      ELSE 'pending'
    END,
    SPLIT_PART(NEW.email, '@', 2),
    CASE 
      WHEN NEW.email = 'admin@ocp.com' THEN NOW()
      ELSE NULL
    END,
    CASE 
      WHEN NEW.email = 'admin@ocp.com' THEN NEW.id
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verify the fix
SELECT 'Profile creation trigger updated successfully!' as status;
