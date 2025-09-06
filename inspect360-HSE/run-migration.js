const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azbiswhhtqkftghmygdm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6Ymlzd2hodHFrZnRnaG15Z2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mjg0MDQsImV4cCI6MjA2ODQwNDQwNH0.aqoaxgqYpaJrIk_IAYa2jHLW0zXJ5Ij5PyAkAfdN8yU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    
    // Add status columns to inspections and templates tables
    const { error: inspectionsError } = await supabase
      .rpc('sql', {
        query: `
          ALTER TABLE inspections 
          ADD COLUMN IF NOT EXISTS inspection_status TEXT DEFAULT 'draft';
        `
      });
    
    if (inspectionsError) {
      console.error('❌ Error adding inspection_status column:', inspectionsError);
    } else {
      console.log('✅ Successfully added inspection_status column to inspections table');
    }

    const { error: templatesError } = await supabase
      .rpc('sql', {
        query: `
          ALTER TABLE templates 
          ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
        `
      });
    
    if (templatesError) {
      console.error('❌ Error adding status column:', templatesError);
    } else {
      console.log('✅ Successfully added status column to templates table');
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
