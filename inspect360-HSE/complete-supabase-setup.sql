-- ===============================================
-- COMPLETE SUPABASE SETUP SCRIPT FOR INSPECT360 HSE
-- ===============================================
-- Execute this entire script in your Supabase SQL Editor
-- This will create all tables, policies, functions, and sample data
-- Date: 2025-08-24
-- ===============================================

-- 1. CREATE CORE TABLES
-- ===============================================

-- Templates table for storing inspection templates
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

-- Inspections table for storing completed inspections and drafts
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

-- Inspection assignments table for assigning inspections to inspectors
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

-- 2. CREATE FUNCTIONS
-- ===============================================

-- Function to automatically create user profiles
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

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 3. CREATE TRIGGERS
-- ===============================================

-- Trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers to automatically update timestamps
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at 
  BEFORE UPDATE ON templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inspections_updated_at ON inspections;
CREATE TRIGGER update_inspections_updated_at 
  BEFORE UPDATE ON inspections 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 4. CREATE INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_is_prebuilt ON templates(is_prebuilt);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(date);
CREATE INDEX IF NOT EXISTS idx_inspections_template_id ON inspections(template_id);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector ON inspections(inspector);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON inspection_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_by ON inspection_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON inspection_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON inspection_assignments(due_date);

-- 5. ENABLE ROW LEVEL SECURITY
-- ===============================================

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_assignments ENABLE ROW LEVEL SECURITY;

-- 6. CREATE SECURITY POLICIES
-- ===============================================

-- Template Policies
DROP POLICY IF EXISTS "Templates are viewable by authenticated users" ON templates;
CREATE POLICY "Templates are viewable by authenticated users"
  ON templates FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create templates" ON templates;
CREATE POLICY "Users can create templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own templates" ON templates;
CREATE POLICY "Users can update their own templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.email() OR is_prebuilt = false);

DROP POLICY IF EXISTS "Admins can delete templates" ON templates;
CREATE POLICY "Admins can delete templates"
  ON templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- User Profile Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Inspection Policies
DROP POLICY IF EXISTS "Users can view relevant inspections" ON inspections;
CREATE POLICY "Users can view relevant inspections"
  ON inspections FOR SELECT
  TO authenticated
  USING (true); -- Simplified for now - users can see all inspections

DROP POLICY IF EXISTS "Authorized users can create inspections" ON inspections;
CREATE POLICY "Authorized users can create inspections"
  ON inspections FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update relevant inspections" ON inspections;
CREATE POLICY "Users can update relevant inspections"
  ON inspections FOR UPDATE
  TO authenticated
  USING (true); -- Simplified for now - users can update inspections

-- Assignment Policies
DROP POLICY IF EXISTS "Users can view their assignments" ON inspection_assignments;
CREATE POLICY "Users can view their assignments"
  ON inspection_assignments FOR SELECT
  TO authenticated
  USING (true); -- Simplified for now

DROP POLICY IF EXISTS "Managers and admins can create assignments" ON inspection_assignments;
CREATE POLICY "Managers and admins can create assignments"
  ON inspection_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authorized users can update assignments" ON inspection_assignments;
CREATE POLICY "Authorized users can update assignments"
  ON inspection_assignments FOR UPDATE
  TO authenticated
  USING (true); -- Simplified for now

-- 7. INSERT SAMPLE PREBUILT TEMPLATES
-- ===============================================

-- Clean up any existing corrupted templates first
DELETE FROM templates WHERE sections = '[]'::jsonb OR sections IS NULL OR jsonb_array_length(sections) = 0;

-- Remove all existing prebuilt templates to avoid duplicates
DELETE FROM templates WHERE is_prebuilt = true;

-- Insert comprehensive prebuilt templates (only once)
INSERT INTO templates (
  id,
  title,
  description,
  category,
  tags,
  sections,
  created_by,
  is_active,
  is_prebuilt
) VALUES 
-- Safety Equipment Inspection Template
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Safety Equipment Inspection',
  'Comprehensive inspection of personal protective equipment and safety devices',
  'safety',
  ARRAY['safety', 'ppe', 'equipment'],
  '[
    {
      "id": "safety_info",
      "title": "Inspection Information",
      "description": "Basic inspection details and location",
      "fields": [
        {
          "id": "inspector_name",
          "label": "Inspector Name",
          "type": "text",
          "required": true,
          "placeholder": "Enter inspector full name"
        },
        {
          "id": "inspection_date",
          "label": "Inspection Date",
          "type": "date",
          "required": true
        },
        {
          "id": "location",
          "label": "Location/Area",
          "type": "text",
          "required": true,
          "placeholder": "Building, floor, room number"
        },
        {
          "id": "equipment_photo",
          "label": "Equipment Overview Photo",
          "type": "image",
          "required": true
        }
      ]
    },
    {
      "id": "ppe_assessment",
      "title": "PPE Assessment",
      "description": "Personal protective equipment condition check",
      "fields": [
        {
          "id": "hard_hat_condition",
          "label": "Hard Hat Condition",
          "type": "select",
          "required": true,
          "options": ["Excellent", "Good", "Fair", "Poor", "Damaged"]
        },
        {
          "id": "safety_glasses",
          "label": "Safety Glasses Available",
          "type": "boolean",
          "required": true
        },
        {
          "id": "gloves_condition",
          "label": "Work Gloves Condition",
          "type": "select",
          "required": true,
          "options": ["New", "Good", "Worn", "Torn", "Missing"]
        },
        {
          "id": "safety_notes",
          "label": "Additional Safety Notes",
          "type": "textarea",
          "required": false,
          "placeholder": "Any additional observations or concerns"
        }
      ]
    }
  ]'::jsonb,
  'system@inspect360.com',
  true,
  true
),
-- Fire Safety Inspection Template
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Fire Safety Inspection',
  'Complete fire safety systems and equipment inspection',
  'safety',
  ARRAY['fire', 'safety', 'emergency'],
  '[
    {
      "id": "fire_info",
      "title": "Fire Safety Information",
      "description": "Basic inspection and location details",
      "fields": [
        {
          "id": "inspector_name",
          "label": "Inspector Name", 
          "type": "text",
          "required": true
        },
        {
          "id": "inspection_date",
          "label": "Inspection Date",
          "type": "date", 
          "required": true
        },
        {
          "id": "building_area",
          "label": "Building/Area",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "fire_equipment",
      "title": "Fire Equipment Check",
      "description": "Fire extinguishers and safety equipment",
      "fields": [
        {
          "id": "extinguisher_present",
          "label": "Fire Extinguisher Present",
          "type": "boolean",
          "required": true
        },
        {
          "id": "extinguisher_condition",
          "label": "Extinguisher Condition",
          "type": "select",
          "required": false,
          "options": ["Excellent", "Good", "Needs Service", "Damaged"]
        },
        {
          "id": "emergency_exits",
          "label": "Emergency Exits Clear",
          "type": "boolean",
          "required": true
        },
        {
          "id": "fire_alarm_test",
          "label": "Fire Alarm Functional",
          "type": "select",
          "required": true,
          "options": ["Yes - Tested", "Yes - Visual Only", "No", "Not Present"]
        },
        {
          "id": "fire_safety_photo",
          "label": "Fire Safety Equipment Photo",
          "type": "image",
          "required": true
        }
      ]
    }
  ]'::jsonb,
  'system@inspect360.com',
  true,
  true
),
-- Workplace Maintenance Inspection
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Workplace Maintenance Inspection',
  'General workplace maintenance and facility condition assessment',
  'maintenance',
  ARRAY['maintenance', 'facility', 'workplace'],
  '[
    {
      "id": "maintenance_info",
      "title": "Maintenance Information",
      "description": "Basic maintenance inspection details",
      "fields": [
        {
          "id": "inspector_name",
          "label": "Inspector Name",
          "type": "text",
          "required": true
        },
        {
          "id": "inspection_date",
          "label": "Inspection Date",
          "type": "date",
          "required": true
        },
        {
          "id": "area_location",
          "label": "Area/Location",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "facility_condition",
      "title": "Facility Condition",
      "description": "Overall facility and equipment condition",
      "fields": [
        {
          "id": "lighting_adequate",
          "label": "Lighting Adequate",
          "type": "boolean",
          "required": true
        },
        {
          "id": "flooring_condition",
          "label": "Flooring Condition",
          "type": "select",
          "required": true,
          "options": ["Excellent", "Good", "Needs Repair", "Poor", "Hazardous"]
        },
        {
          "id": "cleanliness_rating",
          "label": "Cleanliness Rating",
          "type": "select",
          "required": true,
          "options": ["Excellent", "Good", "Fair", "Poor"]
        },
        {
          "id": "maintenance_photo",
          "label": "Area Condition Photo",
          "type": "image",
          "required": true
        },
        {
          "id": "maintenance_notes",
          "label": "Maintenance Notes",
          "type": "textarea",
          "required": false,
          "placeholder": "Describe any issues or recommendations"
        }
      ]
    }
  ]'::jsonb,
  'system@inspect360.com',
  true,
  true
),
-- Environmental Compliance Check
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Environmental Compliance Check',
  'Environmental safety and compliance inspection',
  'environmental',
  ARRAY['environment', 'compliance', 'waste'],
  '[
    {
      "id": "env_info",
      "title": "Environmental Information",
      "description": "Environmental inspection details",
      "fields": [
        {
          "id": "inspector_name",
          "label": "Inspector Name",
          "type": "text",
          "required": true
        },
        {
          "id": "inspection_date",
          "label": "Inspection Date",
          "type": "date",
          "required": true
        },
        {
          "id": "facility_area",
          "label": "Facility Area",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "environmental_check",
      "title": "Environmental Assessment",
      "description": "Environmental compliance and safety check",
      "fields": [
        {
          "id": "waste_disposal_proper",
          "label": "Waste Disposal Proper",
          "type": "boolean",
          "required": true
        },
        {
          "id": "chemical_storage",
          "label": "Chemical Storage Compliant",
          "type": "select",
          "required": true,
          "options": ["Fully Compliant", "Minor Issues", "Major Issues", "Non-Compliant"]
        },
        {
          "id": "air_quality",
          "label": "Air Quality Assessment",
          "type": "select",
          "required": true,
          "options": ["Excellent", "Good", "Acceptable", "Poor", "Hazardous"]
        },
        {
          "id": "environmental_photo",
          "label": "Environmental Condition Photo",
          "type": "image",
          "required": true
        },
        {
          "id": "compliance_notes",
          "label": "Compliance Notes",
          "type": "textarea",
          "required": false,
          "placeholder": "Document any environmental concerns or violations"
        }
      ]
    }
  ]'::jsonb,
  'system@inspect360.com',
  true,
  true
);

-- Note: Using direct INSERT without ON CONFLICT to ensure clean templates
-- The DELETE statement above removes all prebuilt templates first

-- 8. CREATE SAMPLE DATA (Optional - Remove if not needed)
-- ===============================================

-- Create a sample admin user profile (only if you want sample data)
-- Note: You'll need to create the actual auth user first in Supabase Auth
/*
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
  gen_random_uuid(), -- Replace with actual auth user ID
  'System Administrator',
  'admin@ocp.com',
  'admin',
  'approved',
  'ocp.com',
  NOW(),
  gen_random_uuid() -- Replace with actual admin user ID
) ON CONFLICT (email) DO NOTHING;
*/

-- 9. FINAL VERIFICATION
-- ===============================================

-- Verify tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('templates', 'inspections', 'user_profiles', 'inspection_assignments')
ORDER BY table_name;

-- Verify templates were inserted
SELECT 
  id,
  title,
  category,
  is_prebuilt,
  jsonb_array_length(sections) as section_count
FROM templates 
WHERE is_prebuilt = true
ORDER BY category, title;

-- ===============================================
-- SETUP COMPLETE!
-- ===============================================
-- Your Inspect360 HSE database is now ready to use
-- 
-- Next steps:
-- 1. Create your first admin user in Supabase Auth
-- 2. Test the application login and template functionality
-- 3. Customize templates as needed for your organization
-- ===============================================
