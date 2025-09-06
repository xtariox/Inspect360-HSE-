const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azbiswhhtqkftghmygdm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6Ymlzd2hodHFrZnRnaG15Z2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mjg0MDQsImV4cCI6MjA2ODQwNDQwNH0.aqoaxgqYpaJrIk_IAYa2jHLW0zXJ5Ij5PyAkAfdN8yU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDatabase() {
  try {
    console.log('🔍 Debugging database tables...\n');
    
    // Check inspections table
    console.log('=== INSPECTIONS TABLE ===');
    const { data: inspections, error: inspectionsError } = await supabase
      .from('inspections')
      .select('*');
    
    if (inspectionsError) {
      console.error('❌ Error fetching inspections:', inspectionsError);
    } else {
      console.log(`✅ Found ${inspections.length} inspections`);
      inspections.forEach((inspection, i) => {
        console.log(`  ${i+1}. ID: ${inspection.id}`);
        console.log(`     Title: ${inspection.title}`);
        console.log(`     Status: ${inspection.status}`);
        console.log(`     Inspector: ${inspection.inspector}`);
        console.log(`     Created: ${inspection.created_at}`);
        console.log('');
      });
    }

    // Check inspection_assignments table
    console.log('=== INSPECTION_ASSIGNMENTS TABLE ===');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('inspection_assignments')
      .select('*');
    
    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
    } else {
      console.log(`✅ Found ${assignments.length} assignments`);
      assignments.forEach((assignment, i) => {
        console.log(`  ${i+1}. Assignment ID: ${assignment.id}`);
        console.log(`     Inspection ID: ${assignment.inspection_id}`);
        console.log(`     Assigned to: ${assignment.assigned_to}`);
        console.log(`     Status: ${assignment.status}`);
        console.log(`     Due date: ${assignment.due_date}`);
        console.log('');
      });
    }

    // Check templates table  
    console.log('=== TEMPLATES TABLE ===');
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('id, title, status, category');
    
    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError);
    } else {
      console.log(`✅ Found ${templates.length} templates`);
      templates.forEach((template, i) => {
        console.log(`  ${i+1}. ${template.title} (${template.status}) - ${template.category}`);
      });
    }

    // Check user_profiles table
    console.log('\n=== USER_PROFILES TABLE ===');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role, status');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`✅ Found ${users.length} users`);
      users.forEach((user, i) => {
        console.log(`  ${i+1}. ${user.full_name} (${user.email}) - ${user.role} [${user.status}]`);
      });
    }

    console.log('\n🏁 Database debugging complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
  
  // Exit the process
  process.exit(0);
}

debugDatabase();
