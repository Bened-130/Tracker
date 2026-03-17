import { createClient } from '@supabase/supabase-js';

// YOUR SUPABASE CREDENTIALS (Hardcoded for immediate functionality)
const SUPABASE_URL = 'https://zokmdocanxmlkpoovkrn.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_SWD7mjl3jn-ifwD3XcygKQ_7XW0Xl_Z';

// Debug logging
console.log('Supabase Config:', {
  url: SUPABASE_URL,
  keyPresent: !!SUPABASE_SERVICE_KEY,
  keyLength: SUPABASE_SERVICE_KEY.length
});

// Create client with service role
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

// Test connection
export async function checkSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return { connected: false, error: error.message };
    }
    
    console.log('Supabase connected successfully');
    return { connected: true, data };
  } catch (e) {
    console.error('Supabase exception:', e);
    return { connected: false, error: e.message };
  }
}