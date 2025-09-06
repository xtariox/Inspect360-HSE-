const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azbiswhhtqkftghmygdm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6Ymlzd2hodHFrZnRnaG15Z2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mjg0MDQsImV4cCI6MjA2ODQwNDQwNH0.aqoaxgqYpaJrIk_IAYa2jHLW0zXJ5Ij5PyAkAfdN8yU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestInspections() {
  try {
    console.log('🏗️ Creating test inspections...');

    // Get first template to use as a base
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('*')
      .limit(1);

    if (templatesError || !templates.length) {
      console.error('❌ No templates found to base inspections on');
      return;
    }

    const template = templates[0];
    console.log('📋 Using template:', template.title);

    // Create test inspections with different statuses
    const testInspections = [
      {
        template_id: template.id,
        title: 'Test Safety Inspection - Draft',
        location: 'Building A - Floor 1',
        status: 'draft',
        responses: {},
        sections: template.sections || [],
        photos: [],
        issues: 0,
        categories: [template.category || 'safety'],
        description: 'Test inspection in draft status'
      },
      {
        template_id: template.id,
        title: 'Test Equipment Check - Pending',
        location: 'Manufacturing Area',
        status: 'pending',
        responses: {},
        sections: template.sections || [],
        photos: [],
        issues: 0,
        categories: [template.category || 'maintenance'],
        description: 'Test inspection in pending status'
      },
      {
        template_id: template.id,
        title: 'Test Environmental Audit - In Progress',
        location: 'Storage Warehouse',
        status: 'in-progress',
        responses: {},
        sections: template.sections || [],
        photos: [],
        issues: 2,
        categories: [template.category || 'environmental'],
        description: 'Test inspection in progress'
      },
      {
        template_id: template.id,
        title: 'Test Facility Review - Completed',
        location: 'Office Complex',
        status: 'completed',
        responses: {},
        sections: template.sections || [],
        photos: [],
        issues: 1,
        categories: [template.category || 'general'],
        description: 'Test inspection completed',
        score: 85
      }
    ];

    // Insert test inspections
    const { data, error } = await supabase
      .from('inspections')
      .insert(testInspections)
      .select('*');

    if (error) {
      console.error('❌ Error creating test inspections:', error);
    } else {
      console.log('✅ Created test inspections:', data.length);
      data.forEach(inspection => {
        console.log(`  - ${inspection.title} (${inspection.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestInspections();
