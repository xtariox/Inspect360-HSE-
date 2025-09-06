const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azbiswhhtqkftghmygdm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6Ymlzd2hodHFrZnRnaG15Z2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mjg0MDQsImV4cCI6MjA2ODQwNDQwNH0.aqoaxgqYpaJrIk_IAYa2jHLW0zXJ5Ij5PyAkAfdN8yU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseDirectly() {
  console.log('🔗 Testing Supabase connection directly...');
  
  try {
    // Test 1: Check if we can read from templates table
    console.log('📋 Fetching existing templates...');
    const { data: existingTemplates, error: fetchError } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (fetchError) {
      console.error('❌ Error fetching templates:', fetchError);
      return;
    }
    
    console.log('✅ Successfully fetched templates:', existingTemplates?.length || 0);
    
    if (existingTemplates && existingTemplates.length > 0) {
      console.log('📋 First template:', existingTemplates[0]);
    }
    
    // Test 2: Try to create a simple test template
    console.log('💾 Attempting to create test template...');
    
    const testTemplate = {
      id: 'test-' + Date.now(),
      title: 'Direct Test Template',
      description: 'Testing direct Supabase connection',
      category: 'test',
      tags: ['test'],
      sections: [
        {
          id: 'section1',
          title: 'Test Section',
          description: 'A test section',
          fields: [
            {
              id: 'field1',
              label: 'Test Field',
              type: 'text',
              required: true
            }
          ],
          order: 0
        }
      ],
      status: 'active',
      is_active: true,
      is_prebuilt: false,
      created_by: 'test-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('💾 Template data to save:', testTemplate);
    
    const { data: savedTemplate, error: saveError } = await supabase
      .from('templates')
      .insert(testTemplate)
      .select('*')
      .single();
      
    if (saveError) {
      console.error('❌ Error saving template:', saveError);
      console.error('❌ Error details:', JSON.stringify(saveError, null, 2));
      return;
    }
    
    console.log('✅ Template saved successfully:', savedTemplate);
    
    // Test 3: Verify the template was saved
    console.log('🔍 Verifying template was saved...');
    const { data: verifyTemplate, error: verifyError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', testTemplate.id)
      .single();
      
    if (verifyError) {
      console.error('❌ Error verifying template:', verifyError);
    } else {
      console.log('✅ Template verified in database:', verifyTemplate.title);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testSupabaseDirectly();
