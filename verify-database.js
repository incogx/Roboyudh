// Quick verification script to check if database is set up
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umidkzbqpfveovsxalcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtaWRremJxcGZ2ZW92c3hhbGNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzIyODYsImV4cCI6MjA4MzgwODI4Nn0.ul55raSSyLLuJoKVdQncNaRBYUubf8gAmxE_Vf71AVU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('🔍 Checking database setup...\n');

  // Check tables exist
  const tables = ['events', 'teams', 'team_members', 'payments', 'tickets', 'leaderboard'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ Table '${table}': NOT FOUND or RLS blocking`);
        console.log(`   Error: ${error.message}\n`);
      } else {
        console.log(`✅ Table '${table}': EXISTS`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ERROR - ${err.message}\n`);
    }
  }

  // Check if events have data
  try {
    const { data: events, error } = await supabase.from('events').select('*');
    if (error) {
      console.log(`\n⚠️  Cannot read events: ${error.message}`);
      console.log('   This likely means RLS policies are not set up or tables don\'t exist.');
    } else {
      console.log(`\n✅ Events table has ${events?.length || 0} events`);
      if (events && events.length > 0) {
        console.log('   Sample event:', events[0].name);
      }
    }
  } catch (err) {
    console.log(`\n❌ Error checking events: ${err.message}`);
  }

  // Check registrations
  try {
    const { data: teams, error } = await supabase.from('teams').select('*');
    if (error) {
      console.log(`\n⚠️  Cannot read teams: ${error.message}`);
    } else {
      console.log(`\n📊 Found ${teams?.length || 0} team registrations`);
    }
  } catch (err) {
    console.log(`\n❌ Error checking teams: ${err.message}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📋 NEXT STEPS:');
  console.log('1. If tables are missing, deploy sql/schema.sql to Supabase');
  console.log('2. Go to: https://umidkzbqpfveovsxalcj.supabase.co');
  console.log('3. Click "SQL Editor" → "New Query"');
  console.log('4. Copy entire sql/schema.sql file');
  console.log('5. Paste and click "Run"');
  console.log('6. Refresh this page to verify\n');
}

verifyDatabase();
