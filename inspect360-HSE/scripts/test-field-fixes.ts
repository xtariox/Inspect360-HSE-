import { TemplatesService } from '../services/templatesService';

async function testFieldFixes() {
  try {
    console.log('🔧 Testing field fixes...\n');
    
    // Step 1: Run diagnostics to see current issues
    console.log('1️⃣ Running template diagnostics...');
    await TemplatesService.diagnoseTemplateIssues();
    
    console.log('\n2️⃣ Running cleanup to fix issues...');
    await TemplatesService.cleanupCorruptedTemplates();
    
    console.log('\n3️⃣ Running diagnostics again to verify fixes...');
    await TemplatesService.diagnoseTemplateIssues();
    
    console.log('\n4️⃣ Fetching templates to test mapping...');
    const templates = await TemplatesService.getAllTemplates();
    
    console.log(`\n📊 Successfully loaded ${templates.length} templates:`);
    templates.forEach((template, index) => {
      const totalFields = template.sections?.reduce((count, section) => {
        return count + (section.fields?.length || 0);
      }, 0) || 0;
      
      console.log(`   ${index + 1}. "${template.title}" - ${template.sections?.length || 0} sections, ${totalFields} total fields`);
    });
    
    console.log('\n✅ Field fix testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during field fix testing:', error);
  }
}

// Run the test
testFieldFixes();
