import { createClient } from '@supabase/supabase-js';

// YOUR CREDENTIALS - Replace with your actual legacy JWT service_role key
const SUPABASE_URL = 'https://zokmdocanxmlkpoovkrn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva21kb2NhbnhtbGtwb292a3JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MzUwNSwiZXhwIjoyMDg4ODE5NTA1fQ.n81cXMboxC4RZsgkKk8Np0kE-nHfKZftMu1YMDe7buQ';

// Validate
if (!SUPABASE_SERVICE_KEY) {
  console.error('CRITICAL: SUPABASE_SERVICE_KEY environment variable is not set!');
}

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

export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('classes').select('count').limit(1);
    
    if (error) {
      console.error('DB Error:', error);
      return { connected: false, error: error.message };
    }
    
    return { connected: true };
  } catch (e) {
    console.error('Exception:', e);
    return { connected: false, error: e.message };
  }
}