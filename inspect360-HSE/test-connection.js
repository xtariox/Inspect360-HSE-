const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azbiswhhtqkftghmygdm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6Ymlzd2hodHFrZnRnaG15Z2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mjg0MDQsImV4cCI6MjA2ODQwNDQwNH0.aqoaxgqYpaJrIk_IAYa2jHLW0zXJ5Ij5PyAkAfdN8yU';

console.log('🔗 Testing Supabase connection...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simple test
supabase
  .from('templates')
  .select('count', { count: 'exact' })
  .then(({ data, error, count }) => {
    if (error) {
      console.error('❌ Connection error:', error);
    } else {
      console.log('✅ Connection successful! Templates count:', count);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
