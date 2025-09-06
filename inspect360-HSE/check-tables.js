const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azbiswhhtqkftghmygdm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6Ymlzd2hodHFrZnRnaG15Z2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mjg0MDQsImV4cCI6MjA2ODQwNDQwNH0.aqoaxgqYpaJrIk_IAYa2jHLW0zXJ5Ij5PyAkAfdN8yU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  try {
    console.log('🔍 Checking existing table structure...');
    
    // Check inspections table count and status distribution
    const { data: allInspections, error: inspectionsError } = await supabase
      .from('inspections')
      .select('*');
    
    if (inspectionsError) {
      console.error('❌ Error fetching inspections:', inspectionsError);
    } else {
      console.log('✅ Total inspections in database:', allInspections.length);
      if (allInspections.length > 0) {
        console.log('📋 Inspections table columns:', Object.keys(allInspections[0]));
        
        // Show status distribution
        const statusCounts = {};
        allInspections.forEach(inspection => {
          const status = inspection.status || 'no-status';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log('📊 Status distribution:', statusCounts);
        
        // Show first few inspections
        console.log('📝 Sample inspections:');
        allInspections.slice(0, 3).forEach(inspection => {
          console.log(`  - ID: ${inspection.id}, Title: ${inspection.title}, Status: ${inspection.status}`);
        });
      }
    }

    // Check assignments table 
    const { data: assignments, error: assignmentsError } = await supabase
      .from('inspection_assignments')
      .select('*');
    
    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
    } else {
      console.log('✅ Total assignments in database:', assignments.length);
      if (assignments.length > 0) {
        console.log('📋 Assignments table columns:', Object.keys(assignments[0]));
        
        // Show status distribution
        const statusCounts = {};
        assignments.forEach(assignment => {
          const status = assignment.status || 'no-status';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log('📊 Assignment status distribution:', statusCounts);
        
        // Show detailed assignment data
        console.log('📝 All assignments:');
        assignments.forEach((assignment, index) => {
          console.log(`  ${index + 1}. ID: ${assignment.id}`);
          console.log(`     Inspection ID: ${assignment.inspection_id}`);
          console.log(`     Assigned to: ${assignment.assigned_to}`);
          console.log(`     Status: ${assignment.status}`);
          console.log(`     Due date: ${assignment.due_date}`);
          console.log(`     Notes: ${assignment.notes || 'No notes'}`);
          console.log('');
        });
      } else {
        console.log('ℹ️ No assignments found in table');
      }
    }

    // Check templates table structure  
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('*');
    
    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError);
    } else {
      console.log('✅ Total templates in database:', templates.length);
      if (templates.length > 0) {
        console.log('📋 Templates table columns:', Object.keys(templates[0]));
        
        // Show status distribution
        const statusCounts = {};
        templates.forEach(template => {
          const status = template.status || 'no-status';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log('📊 Template status distribution:', statusCounts);
        
        // Show first few templates
        console.log('📝 Sample templates:');
        templates.slice(0, 3).forEach(template => {
          console.log(`  - ID: ${template.id}, Title: ${template.title}, Status: ${template.status}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

checkTables();
