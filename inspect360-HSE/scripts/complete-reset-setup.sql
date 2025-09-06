-- INSPECT360 HSE - COMPLETE RESET AND SETUP
-- Run this ONCE in your Supabase SQL Editor to completely reset and set up everything
-- ⚠️ WARNING: This will DELETE all existing data!

-- ========================================
-- 0. RESET EVERYTHING (DELETE ALL DATA)
-- ========================================

-- Drop all policies first
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read active templates" ON templates;
DROP POLICY IF EXISTS "Admins can manage all templates" ON templates;
DROP POLICY IF EXISTS "Users can read own inspections" ON inspections;
DROP POLICY IF EXISTS "Users can manage own inspections" ON inspections;
DROP POLICY IF EXISTS "Users can read own assignments" ON inspection_assignments;
DROP POLICY IF EXISTS "Managers can manage assignments" ON inspection_assignments;

-- Disable RLS to clean up
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspections DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_assignments DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Clear all data
TRUNCATE TABLE inspection_assignments CASCADE;
TRUNCATE TABLE inspections CASCADE;
TRUNCATE TABLE templates CASCADE;
TRUNCATE TABLE user_profiles CASCADE;

-- ========================================
-- 1. CREATE TABLES
-- ========================================

-- User profiles table for role-based access control
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('inspector', 'manager', 'admin')) DEFAULT 'inspector',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  company_domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id)
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  sections JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  is_prebuilt BOOLEAN DEFAULT false
);

-- Inspections table
CREATE TABLE IF NOT EXISTS inspections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  inspector TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'in-progress', 'completed', 'pending')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  responses JSONB NOT NULL DEFAULT '[]',
  photos TEXT[] DEFAULT '{}',
  score INTEGER,
  issues INTEGER DEFAULT 0,
  categories TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Inspection assignments table
CREATE TABLE IF NOT EXISTS inspection_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')) DEFAULT 'assigned',
  notes TEXT
);

-- ========================================
-- 2. AUTOMATIC PROFILE CREATION
-- ========================================

-- Function to automatically create user profiles when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', EXCLUDED.full_name),
    email = NEW.email,
    role = CASE 
      WHEN NEW.email = 'admin@ocp.com' THEN 'admin'
      WHEN NEW.raw_user_meta_data->>'role' = 'manager' THEN 'manager'
      ELSE EXCLUDED.role
    END,
    status = CASE 
      WHEN NEW.email = 'admin@ocp.com' THEN 'approved'
      ELSE EXCLUDED.status
    END,
    company_domain = SPLIT_PART(NEW.email, '@', 2),
    approved_at = CASE 
      WHEN NEW.email = 'admin@ocp.com' THEN NOW()
      ELSE EXCLUDED.approved_at
    END,
    approved_by = CASE 
      WHEN NEW.email = 'admin@ocp.com' THEN NEW.id
      ELSE EXCLUDED.approved_by
    END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 3. CREATE ADMIN PROFILE (for existing admin user)
-- ========================================

-- Create admin profile if auth user exists
INSERT INTO user_profiles (
  id, 
  full_name, 
  email, 
  role, 
  status, 
  company_domain, 
  approved_at, 
  approved_by
)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'System Administrator'),
  'admin@ocp.com',
  'admin',
  'approved',
  'ocp.com',
  NOW(),
  au.id
FROM auth.users au 
WHERE au.email = 'admin@ocp.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'approved',
  approved_at = NOW(),
  approved_by = EXCLUDED.approved_by;

-- ========================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_assignments ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can read own profile" ON user_profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON user_profiles
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.id = auth.uid() AND up.role = 'admin' AND up.status = 'approved'
));

CREATE POLICY "Admins can update all profiles" ON user_profiles
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.id = auth.uid() AND up.role = 'admin' AND up.status = 'approved'
));

CREATE POLICY "Admins can insert profiles" ON user_profiles
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.id = auth.uid() AND up.role = 'admin' AND up.status = 'approved'
));

-- Templates Policies
CREATE POLICY "Users can read active templates" ON templates
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all templates" ON templates
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.id = auth.uid() AND up.role = 'admin' AND up.status = 'approved'
));

-- Inspections Policies
CREATE POLICY "Users can read own inspections" ON inspections
FOR SELECT
USING (
  inspector = (SELECT email FROM user_profiles WHERE id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'manager') AND up.status = 'approved'
  )
);

CREATE POLICY "Users can manage own inspections" ON inspections
FOR ALL
USING (
  inspector = (SELECT email FROM user_profiles WHERE id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'manager') AND up.status = 'approved'
  )
);

-- Inspection Assignments Policies
CREATE POLICY "Users can read own assignments" ON inspection_assignments
FOR SELECT
USING (
  assigned_to = auth.uid()
  OR assigned_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'manager') AND up.status = 'approved'
  )
);

CREATE POLICY "Managers can manage assignments" ON inspection_assignments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.id = auth.uid() AND up.role IN ('admin', 'manager') AND up.status = 'approved'
));

-- ========================================
-- 5. INSERT PREBUILT TEMPLATES
-- ========================================

INSERT INTO templates (title, description, category, tags, sections, created_by, is_active, is_prebuilt) VALUES
(
  'General Safety Inspection',
  'Comprehensive safety inspection template for workplace safety assessment',
  'safety',
  ARRAY['safety', 'general', 'workplace'],
  '[
    {
      "id": 1,
      "title": "Basic Information",
      "fields": [
        {"id": "title", "label": "Inspection Title", "type": "text", "required": true},
        {"id": "location", "label": "Location/Area", "type": "text", "required": true},
        {"id": "inspector", "label": "Inspector Name", "type": "text", "required": true},
        {"id": "date", "label": "Inspection Date", "type": "date", "required": true},
        {"id": "time", "label": "Inspection Time", "type": "time", "required": true}
      ]
    },
    {
      "id": 2,
      "title": "Safety Equipment Check",
      "fields": [
        {"id": "ppe_available", "label": "PPE Available and Accessible", "type": "boolean", "required": true},
        {"id": "safety_signs", "label": "Safety Signs Visible and Clear", "type": "boolean", "required": true},
        {"id": "emergency_exits", "label": "Emergency Exits Clear", "type": "boolean", "required": true},
        {"id": "first_aid_kit", "label": "First Aid Kit Available", "type": "boolean", "required": true}
      ]
    }
  ]'::jsonb,
  'system',
  true,
  true
);

-- ========================================
-- 6. CREATE INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(date);

-- ========================================
-- 7. VERIFICATION
-- ========================================

-- Check if setup was successful
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_profiles WHERE email = 'admin@ocp.com' AND role = 'admin') 
    THEN '✅ SUCCESS: Admin profile exists!'
    ELSE '⚠️ WARNING: Admin user not found in auth.users. Create user with email admin@ocp.com first!'
  END as setup_status;

-- Show admin profile (if exists)
SELECT 'Admin Profile:' as info;
SELECT id, full_name, email, role, status, created_at 
FROM user_profiles 
WHERE email = 'admin@ocp.com';

-- Show RLS status
SELECT 'Row Level Security Status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'templates', 'inspections', 'inspection_assignments');

-- Show policies
SELECT 'Security Policies:' as info;
SELECT tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'templates', 'inspections', 'inspection_assignments')
ORDER BY tablename, policyname;

SELECT '✅ Setup completed successfully!' as final_status;
