import { createClient } from '@supabase/supabase-js';

// Hardcoded fallback for testing (replace with your actual values)
const FALLBACK_URL = 'https://nbbyzeswyldybyfolumz.supabase.co';
const FALLBACK_KEY = 'your-service-role-key-here';

const supabaseUrl = process.env.SUPABASE_URL || FALLBACK_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || FALLBACK_KEY;

console.log('Supabase config:', {
  envUrlSet: !!process.env.SUPABASE_URL,
  envKeySet: !!process.env.SUPABASE_SERVICE_KEY,
  usingFallback: !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY
});

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
  console.error('CRITICAL: Supabase URL or Key not properly configured!');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('classes').select('count').limit(1);
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase connection exception:', e);
    return false;
  }
}