import dotenv from 'dotenv';
dotenv.config();

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aupodprsjpcnilwvmtku.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const keyToUse = serviceRoleKey || supabaseKey;

if (!keyToUse) {
  throw new Error('Supabase key is required');
}

// Create client with explicit schema
export const supabase: SupabaseClient = createClient(supabaseUrl, keyToUse, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

export const supabaseAdmin = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase;

export async function connectDatabase(): Promise<void> {
  try {
    const { error } = await supabase.from('agents').select('id').limit(1);
    if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      throw error;
    }
    console.log('Supabase database connected successfully');
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    throw error;
  }
}

export default supabase;
