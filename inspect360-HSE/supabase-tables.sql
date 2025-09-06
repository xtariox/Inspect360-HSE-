-- Supabase SQL Tables for Inspect360 HSE App
-- Execute these SQL commands in your Supabase SQL editor

-- 1. Templates table for storing inspection templates
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

-- 2. Inspections table for storing completed inspections and drafts
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

-- 3. User profiles table for role-based access control
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

-- 3.1. Create function to automatically create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract full name from user metadata or use default
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

-- 3.2. Create trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Inspection assignments table for assigning inspections to inspectors
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

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_is_prebuilt ON templates(is_prebuilt);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(date);
CREATE INDEX IF NOT EXISTS idx_inspections_template_id ON inspections(template_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON inspection_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_by ON inspection_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON inspection_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON inspection_assignments(due_date);

-- 6. Create RLS (Row Level Security) policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read templates
CREATE POLICY "Templates are viewable by authenticated users"
  ON templates FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create/update their own templates
CREATE POLICY "Users can create templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.email() OR is_prebuilt = false);

-- 6. Create RLS (Row Level Security) policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_assignments ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read templates
CREATE POLICY "Templates are viewable by authenticated users"
  ON templates FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create/update their own templates
CREATE POLICY "Users can create templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.email() OR is_prebuilt = false);

-- User profiles policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins and managers can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Inspection policies based on role
CREATE POLICY "Inspectors can view assigned inspections"
  ON inspections FOR SELECT
  TO authenticated
  USING (
    -- Inspectors can only see inspections assigned to them
    EXISTS (
      SELECT 1 FROM inspection_assignments 
      WHERE inspection_id = inspections.id 
      AND assigned_to = auth.uid()
    )
    OR
    -- Admins and managers can see all inspections
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers and admins can create inspections"
  ON inspections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can update their assigned inspections"
  ON inspections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inspection_assignments 
      WHERE inspection_id = inspections.id 
      AND assigned_to = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Assignment policies
CREATE POLICY "Users can view their assignments"
  ON inspection_assignments FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() 
    OR assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Managers and admins can create assignments"
  ON inspection_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers and admins can update assignments"
  ON inspection_assignments FOR UPDATE
  TO authenticated
  USING (
    assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 7. Insert prebuilt templates (will be handled by the service)
-- The TemplatesService.initializePrebuiltTemplates() will populate these

-- 8. Update function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 9. Create triggers to automatically update timestamps
CREATE TRIGGER update_templates_updated_at 
  BEFORE UPDATE ON templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at 
  BEFORE UPDATE ON inspections 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
