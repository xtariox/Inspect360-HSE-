// Test script to verify draft functionality
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-supabase-anon-key';

async function testDraftFunctionality() {
  console.log('🧪 Testing draft functionality...');
  
  // Test 1: Check if columns exist
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('📋 Testing inspection_status column...');
    const { data: inspectionTest, error: inspectionError } = await supabase
      .from('inspections')
      .select('inspection_status')
      .limit(1);
    
    if (inspectionError) {
      console.error('❌ inspection_status column not found:', inspectionError.message);
    } else {
      console.log('✅ inspection_status column exists');
    }
    
    console.log('📋 Testing template status column...');
    const { data: templateTest, error: templateError } = await supabase
      .from('templates')
      .select('status')
      .limit(1);
    
    if (templateError) {
      console.error('❌ template status column not found:', templateError.message);
    } else {
      console.log('✅ template status column exists');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Uncomment to run the test
// testDraftFunctionality();

console.log('💡 To test draft functionality:');
console.log('1. Go to the app and create a new inspection');
console.log('2. Fill in some basic details and click "Save as Draft"');
console.log('3. Go to the Inspections screen and filter by "draft"');
console.log('4. Create a new template and click "Save as Draft"');
console.log('5. Check the templates screen with different status filters');
