// Test if authenticated user can write to database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umidkzbqpfveovsxalcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtaWRremJxcGZ2ZW92c3hhbGNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzIyODYsImV4cCI6MjA4MzgwODI4Nn0.ul55raSSyLLuJoKVdQncNaRBYUubf8gAmxE_Vf71AVU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🧪 Testing Database Write Permissions\n');
  
  // Check current auth status
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.log('❌ Auth error:', sessionError.message);
    return;
  }
  
  if (!session) {
    console.log('⚠️  No active session - user not logged in');
    console.log('\nTo test writes, you need to be logged in.');
    console.log('Try registering through the app while watching browser console for errors.\n');
    return;
  }
  
  console.log('✅ User authenticated:', session.user.email);
  console.log('   User ID:', session.user.id);
  
  // Try to read teams
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('*');
    
  if (teamsError) {
    console.log('\n❌ Error reading teams:', teamsError.message);
  } else {
    console.log(`\n✅ Can read teams table: ${teams.length} teams found`);
  }
  
  // Try to read events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name, category');
    
  if (eventsError) {
    console.log('❌ Error reading events:', eventsError.message);
    return;
  }
  
  console.log(`✅ Can read events: ${events.length} events available\n`);
  
  if (events.length === 0) {
    console.log('⚠️  No events in database. Run the seed data script first.');
    return;
  }
  
  // Test write (will be rolled back)
  const testEventId = events[0].id;
  console.log('Testing write permission with event:', events[0].name);
  
  const { data: testTeam, error: writeError } = await supabase
    .from('teams')
    .insert({
      event_id: testEventId,
      team_name: 'TEST_TEAM_DELETE_ME',
      college_name: 'Test College',
      team_size: 1,
      created_by: session.user.id,
      is_onspot: false
    })
    .select()
    .single();
    
  if (writeError) {
    console.log('\n❌ WRITE FAILED:', writeError.message);
    console.log('   Code:', writeError.code);
    console.log('   Details:', writeError.details);
    console.log('\n🔍 Possible causes:');
    console.log('   1. RLS policies not enabled');
    console.log('   2. is_admin() function missing');
    console.log('   3. SQL schema not fully deployed');
    console.log('\n📋 Fix: Re-run sql/schema.sql in Supabase SQL Editor\n');
  } else {
    console.log('\n✅ WRITE SUCCESSFUL - test team created!');
    console.log('   Team ID:', testTeam.id);
    
    // Clean up test data
    const { error: deleteError } = await supabase
      .from('teams')
      .delete()
      .eq('id', testTeam.id);
      
    if (deleteError) {
      console.log('⚠️  Could not delete test team:', deleteError.message);
      console.log('   Please delete manually from Supabase dashboard');
    } else {
      console.log('✅ Test team deleted\n');
    }
  }
}

testDatabase().catch(console.error);
