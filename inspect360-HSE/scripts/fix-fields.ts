import { TemplatesService } from '../services/templatesService';

async function fixFieldsIssue() {
  try {
    console.log('🧹 Starting template field cleanup...');
    
    // Run the cleanup function to fix any corrupted templates
    await TemplatesService.cleanupCorruptedTemplates();
    
    // Also get all templates to see current state
    console.log('📋 Fetching all templates to check for issues...');
    const templates = await TemplatesService.getAllTemplates();
    
    console.log(`📊 Found ${templates.length} templates`);
    
    templates.forEach((template, index) => {
      console.log(`\n📋 Template ${index + 1}: "${template.title}"`);
      console.log(`   - Sections: ${template.sections?.length || 0}`);
      
      template.sections?.forEach((section, sectionIndex) => {
        console.log(`   - Section ${sectionIndex + 1}: "${section.title}"`);
        console.log(`     - Fields: ${section.fields?.length || 0}`);
        
        if (!Array.isArray(section.fields)) {
          console.error(`     ❌ ERROR: Section "${section.title}" has invalid fields:`, section.fields);
        } else if (section.fields.length === 0) {
          console.warn(`     ⚠️ WARNING: Section "${section.title}" has no fields`);
        } else {
          section.fields.forEach((field, fieldIndex) => {
            if (!field.type) {
              console.error(`     ❌ ERROR: Field ${fieldIndex + 1} "${field.label}" missing type:`, field);
            } else {
              console.log(`     ✅ Field ${fieldIndex + 1}: "${field.label}" (${field.type})`);
            }
          });
        }
      });
    });
    
    console.log('\n✅ Field analysis complete!');
    
  } catch (error) {
    console.error('❌ Error fixing fields:', error);
  }
}

// Run the script
fixFieldsIssue();
