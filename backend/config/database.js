// backend/config/database.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

const testConnection = async () => {
  try {
    const { error } = await supabase
      .from('students')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('DB Error:', error.message);
    return false;
  }
};

const isRLSError = (error) => {
  return error?.code === '42501' || 
         error?.message?.includes('permission denied');
};

module.exports = { 
  supabase, 
  testConnection,
  isRLSError
};