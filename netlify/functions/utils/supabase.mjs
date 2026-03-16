// Supabase client for Netlify Functions
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

// Create client with connection pooling for serverless
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Health check helper
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('students').select('count').limit(1);
    return !error;
  } catch (e) {
    return false;
  }
}