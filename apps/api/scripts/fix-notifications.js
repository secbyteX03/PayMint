import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aupodprsjpcnilwvmtku.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey!);

async function fixNotificationsTable() {
  console.log('Dropping and recreating notifications table...');
  
  // First try to drop the table
  try {
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql: 'DROP TABLE IF EXISTS notifications CASCADE;' 
    });
    if (dropError) {
      console.log('Drop error (expected in some Supabase setups):', dropError.message);
    }
  } catch (e) {
    console.log('Could not drop table via RPC');
  }
  
  // Create table with proper columns
  const createSQL = `
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_address VARCHAR(256) NOT NULL,
      type VARCHAR(64) NOT NULL,
      title VARCHAR(256) NOT NULL,
      message TEXT NOT NULL,
      payment_id VARCHAR(256),
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  try {
    // Try using the SQL execution if available
    const { error } = await supabase.rpc('exec_sql', { sql: createSQL });
    if (error) {
      console.log('RPC exec_sql error:', error.message);
      console.log('Trying alternative approach...');
    } else {
      console.log('Table created successfully!');
    }
  } catch (e) {
    console.log('Error:', e);
  }
}

fixNotificationsTable().catch(console.error);