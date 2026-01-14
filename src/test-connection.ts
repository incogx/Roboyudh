import { supabase } from './lib/supabase';

// Test Supabase Connection
async function testConnection() {
  console.log('🔍 Testing Supabase Connection...');
  console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('🔑 Anon Key (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));
  
  try {
    // Test 1: Check Supabase client
    console.log('✅ Supabase client initialized');
    
    // Test 2: Fetch events
    console.log('\n📊 Fetching events...');
    const { data, error } = await supabase
      .from('events')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching events:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error details:', error.details);
      console.error('   Error hint:', error.hint);
    } else {
      console.log('✅ Events fetched successfully!');
      console.log('📦 Number of events:', data?.length || 0);
      console.log('📋 Events:', data);
    }
    
    // Test 3: Check auth status
    const { data: { session } } = await supabase.auth.getSession();
    console.log('\n👤 Auth Status:', session ? 'Logged in' : 'Not logged in');
    
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

// Run test
testConnection();

export {};
