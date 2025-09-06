const { supabase } = require('./config/supabase.ts');

async function testDatabase() {
  console.log('🔗 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('templates')
      .select('count')
      .limit(1);
      
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError);
      return;
    }
    
    console.log('✅ Connection successful');
    
    // Get all templates
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError);
      return;
    }
    
    console.log('📊 Total templates in database:', templates?.length || 0);
    
    if (templates && templates.length > 0) {
      console.log('📋 First few templates:');
      templates.slice(0, 3).forEach((template, index) => {
        console.log(`${index + 1}. ID: ${template.id}`);
        console.log(`   Title: ${template.title}`);
        console.log(`   Category: ${template.category}`);
        console.log(`   Active: ${template.is_active}`);
        console.log(`   Prebuilt: ${template.is_prebuilt}`);
        console.log('   ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();
