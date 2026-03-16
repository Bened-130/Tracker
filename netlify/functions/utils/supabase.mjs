import { createClient } from '@supabase/supabase-js';

// Debug logging
console.log('Supabase config check:', {
  urlExists: !!process.env.SUPABASE_URL,
  keyExists: !!process.env.SUPABASE_SERVICE_KEY,
  urlLength: process.env.SUPABASE_URL?.length,
  keyLength: process.env.SUPABASE_SERVICE_KEY?.length
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Missing Supabase environment variables');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'MISSING');
  console.error('SUPABASE_SERVICE_KEY:', supabaseKey ? 'Set' : 'MISSING');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('classes').select('count').limit(1);
    if (error) {
      console.error('Supabase connection check failed:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase connection exception:', e);
    return false;
  }
}