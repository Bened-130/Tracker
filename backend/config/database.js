// backend/config/database.js
// Supabase connection using ANON KEY with RLS support

const { createClient } = require('@supabase/supabase-js');

// ============================================
// ENVIRONMENT VARIABLES
// ============================================
// SUPABASE_URL      - Your Supabase project URL
// SUPABASE_ANON_KEY - Anon key (RLS policies apply!)
// ============================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Validation
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CRITICAL: Missing Supabase credentials!');
  console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY');
  
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Create Supabase client with anon key
// Note: RLS policies are enforced! Make sure your policies allow operations
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'schoolvibe-tracker'
    }
  }
});

// Test connection (will fail if RLS blocks access)
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      // Check if it's an RLS error
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.error('❌ RLS Policy Error: Anonymous access blocked');
        console.error('   Go to Supabase Dashboard → Database → RLS Policies');
        console.error('   Enable appropriate policies for your tables');
      }
      throw error;
    }
    
    console.log('✅ Database connected (RLS active)');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Check if error is RLS-related
const isRLSError = (error) => {
  return error?.code === '42501' || 
         error?.message?.includes('permission denied') ||
         error?.message?.includes('row-level security');
};

// Get connection info
const getConnectionInfo = () => ({
  url: supabaseUrl,
  hasKey: !!supabaseKey,
  keyPrefix: supabaseKey ? `${supabaseKey.substring(0, 10)}...` : null,
  environment: process.env.NODE_ENV
});

module.exports = { 
  supabase, 
  testConnection,
  isRLSError,
  getConnectionInfo
};