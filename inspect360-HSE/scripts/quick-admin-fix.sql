-- INSPECT360 HSE - Complete Database Setup
-- Run this ONCE in your Supabase SQL Editor to set up everything
-- This replaces all setup scripts and handles admin creation automatically

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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 3. CREATE ADMIN PROFILE (for existing admin user)
-- ========================================

-- Temporarily disable RLS for setup
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

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

-- Insert prebuilt templates
INSERT INTO templates (
  id,
  title,
  description,
  category,
  tags,
  sections,
  created_by,
  is_prebuilt
) VALUES
(
  gen_random_uuid(),
  'Safety Inspection Checklist',
  'Comprehensive safety inspection template for workplace environments',
  'Safety',
  ARRAY['safety', 'inspection', 'workplace'],
  '[
    {
      "id": "general_safety",
      "title": "General Safety",
      "items": [
        {
          "id": "emergency_exits",
          "text": "Emergency exits are clearly marked and unobstructed",
          "type": "checkbox",
          "required": true
        },
        {
          "id": "fire_extinguishers",
          "text": "Fire extinguishers are properly placed and maintained",
          "type": "checkbox",
          "required": true
        },
        {
          "id": "first_aid_kit",
          "text": "First aid kit is accessible and well-stocked",
          "type": "checkbox",
          "required": true
        }
      ]
    },
    {
      "id": "ppe_compliance",
      "title": "PPE Compliance",
      "items": [
        {
          "id": "safety_helmets",
          "text": "Safety helmets are worn in designated areas",
          "type": "checkbox",
          "required": true
        },
        {
          "id": "safety_goggles",
          "text": "Safety goggles are available and in good condition",
          "type": "checkbox",
          "required": false
        }
      ]
    }
  ]'::jsonb,
  'System',
  true
),
(
  gen_random_uuid(),
  'Equipment Maintenance Check',
  'Regular maintenance inspection template for industrial equipment',
  'Maintenance',
  ARRAY['equipment', 'maintenance', 'industrial'],
  '[
    {
      "id": "equipment_condition",
      "title": "Equipment Condition",
      "items": [
        {
          "id": "visual_inspection",
          "text": "Equipment shows no visible damage or wear",
          "type": "checkbox",
          "required": true
        },
        {
          "id": "operational_test",
          "text": "Equipment operates within normal parameters",
          "type": "checkbox",
          "required": true
        },
        {
          "id": "maintenance_records",
          "text": "Maintenance records are up to date",
          "type": "checkbox",
          "required": true
        }
      ]
    }
  ]'::jsonb,
  'System',
  true
),
(
  gen_random_uuid(),
  'Environmental Compliance Audit',
  'Environmental compliance checklist for regulatory requirements',
  'Environmental',
  ARRAY['environmental', 'compliance', 'audit'],
  '[
    {
      "id": "waste_management",
      "title": "Waste Management",
      "items": [
        {
          "id": "waste_segregation",
          "text": "Waste is properly segregated according to type",
          "type": "checkbox",
          "required": true
        },
        {
          "id": "hazardous_waste",
          "text": "Hazardous waste is stored and labeled correctly",
          "type": "checkbox",
          "required": true
        }
      ]
    },
    {
      "id": "emissions_monitoring",
      "title": "Emissions Monitoring",
      "items": [
        {
          "id": "air_quality",
          "text": "Air quality meets regulatory standards",
          "type": "checkbox",
          "required": true
        },
        {
          "id": "noise_levels",
          "text": "Noise levels are within acceptable limits",
          "type": "checkbox",
          "required": false
        }
      ]
    }
  ]'::jsonb,
  'System',
  true
)
ON CONFLICT (id) DO NOTHING;

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
-- 5. CREATE INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(date);

-- ========================================
-- 6. VERIFICATION
-- ========================================

-- Check if setup was successful
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_profiles WHERE email = 'admin@ocp.com' AND role = 'admin') 
    THEN '✅ SUCCESS: Admin profile exists!'
    ELSE '⚠️ INFO: Create admin user in Authentication > Users with email: admin@ocp.com'
  END as setup_status;

-- Show admin profile (if exists)
SELECT id, full_name, email, role, status, created_at 
FROM user_profiles 
WHERE email = 'admin@ocp.com';

-- Show trigger status
SELECT 'Automatic profile creation is now active for new users!' as info;
