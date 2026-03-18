import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const SUPABASE_URL = 'https://zokmdocanxmlkpoovkrn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva21kb2NhbnhtbGtwb292a3JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MzUwNSwiZXhwIjoyMDg4ODE5NTA1fQ.n81cXMboxC4RZsgkKk8Np0kE-nHfKZftMu1YMDe7buQ';

console.log('=== SUPABASE CONFIG ===');
console.log('URL:', SUPABASE_URL);
console.log('Key exists:', !!SUPABASE_KEY);
console.log('Key starts with:', SUPABASE_KEY ? SUPABASE_KEY.substring(0, 10) : 'NONE');

// Create client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Test connection with detailed logging
export async function checkSupabaseConnection() {
  try {
    console.log('Testing connection to Supabase...');
    
    // Try to query classes
    const { data, error, count } = await supabase
      .from('classes')
      .select('*', { count: 'exact' });
    
    console.log('Query result:', {
      hasData: !!data,
      dataLength: data?.length,
      hasError: !!error,
      errorMessage: error?.message,
      count: count
    });
    
    if (error) {
      return { 
        connected: false, 
        error: error.message,
        code: error.code
      };
    }
    
    return { 
      connected: true, 
      count: data?.length || 0,
      sample: data?.[0]?.class_name
    };
    
  } catch (e) {
    console.error('Exception:', e);
    return { connected: false, error: e.message };
  }
}