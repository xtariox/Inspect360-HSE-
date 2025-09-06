// Simple test to debug template issues
import { TemplatesService } from './services/templatesService';

async function testTemplateService() {
  console.log('🔧 Testing template service...');
  
  try {
    // Test 1: Check connection
    console.log('📡 Testing database connection...');
    const connected = await TemplatesService.testConnection();
    console.log('Connection result:', connected);
    
    // Test 2: Try to fetch all templates
    console.log('📋 Fetching all templates...');
    const templates = await TemplatesService.getAllTemplates();
    console.log('Templates fetched:', templates.length);
    
    if (templates.length > 0) {
      console.log('First template:', templates[0]);
    }
    
    // Test 3: Try to create a simple template
    console.log('💾 Creating test template...');
    const testTemplate = {
      id: 'test-template-' + Date.now(),
      title: 'Test Template',
      description: 'A test template',
      category: 'test',
      tags: ['test'],
      sections: [{
        id: 'test-section',
        title: 'Test Section',
        description: 'Test section description',
        fields: [{
          id: 'test-field',
          label: 'Test Field',
          type: 'text' as const,
          required: true
        }],
        order: 0
      }],
      status: 'active' as const,
      isActive: true,
      isPrebuilt: false,
      createdBy: 'test-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const savedTemplate = await TemplatesService.saveTemplate(testTemplate);
    console.log('✅ Test template created:', savedTemplate.id);
    
    // Test 4: Fetch templates again to verify
    console.log('📋 Fetching templates again...');
    const updatedTemplates = await TemplatesService.getAllTemplates();
    console.log('Updated template count:', updatedTemplates.length);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTemplateService();
