const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mmdaqehmlrpeexugdaqs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tZGFxZWhtbHJwZWV4dWdkYXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI4NzkwNzYsImV4cCI6MjAzODQ1NTA3Nn0.H2hk6z0Qb_3h3rPD5LjBUXMUzNjKGKW3GvSCa1u89kU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupEmptyTemplates() {
  console.log('🔧 Starting direct template cleanup...');
  
  try {
    // Get all templates
    const { data: templates, error } = await supabase
      .from('templates')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching templates:', error);
      return;
    }
    
    console.log(`📋 Found ${templates.length} templates to check`);
    
    let deletedCount = 0;
    let validCount = 0;
    
    for (const template of templates) {
      console.log(`\n📋 Checking template: "${template.title}" (ID: ${template.id})`);
      
      // Check if template has empty or invalid sections
      const hasEmptySections = template.sections?.some(section => 
        !Array.isArray(section.fields) || section.fields.length === 0
      );
      
      const hasNoSections = !template.sections || template.sections.length === 0;
      
      if (hasEmptySections || hasNoSections) {
        console.log(`🚫 Template "${template.title}" has empty fields - DELETING`);
        
        // Delete corrupted template
        const { error: deleteError } = await supabase
          .from('templates')
          .delete()
          .eq('id', template.id);
        
        if (deleteError) {
          console.error(`❌ Error deleting template ${template.id}:`, deleteError);
        } else {
          console.log(`✅ Deleted corrupted template "${template.title}"`);
          deletedCount++;
        }
      } else {
        console.log(`✅ Template "${template.title}" is valid (${template.sections.length} sections)`);
        validCount++;
      }
    }
    
    console.log(`\n🎯 Template cleanup completed:`);
    console.log(`   - Valid templates: ${validCount}`);
    console.log(`   - Deleted corrupted templates: ${deletedCount}`);
    
  } catch (error) {
    console.error('❌ Error in cleanupEmptyTemplates:', error);
  }
}

cleanupEmptyTemplates().then(() => process.exit(0));
