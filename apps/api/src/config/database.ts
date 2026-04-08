import { supabase } from './prisma';

export async function connectDatabase(): Promise<void> {
  try {
    // Test the connection by checking if we can reach Supabase
    const { error } = await supabase.from('agents').select('id').limit(1);
    
    if (error && !error.message.includes('relation "agents" does not exist')) {
      // If error is not "table doesn't exist", re-throw
      throw error;
    }
    
    console.log('Supabase database connected successfully');
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    throw error;
  }
}

export { supabase };
export { supabase as prisma };
