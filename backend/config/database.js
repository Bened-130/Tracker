// backend/config/database.js
// Supabase PostgreSQL connection configuration

const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment variables
const supabaseUrl = process.env.zokmdocanxmlkpoovkrn;
const supabaseKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva21kb2NhbnhtbGtwb292a3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDM1MDUsImV4cCI6MjA4ODgxOTUwNX0.Q3lSgdzkgApVEwWxr21CQM1DI_4gqhIuwlsMEvzk8R8;
// Validate credentials
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Required environment variables:');
  console.error('  - SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_KEY');
}

// Create Supabase client with connection pooling settings
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
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

// Test connection function
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Health check for connection pool
const checkHealth = async () => {
  try {
    const { error } = await supabase.rpc('pg_health_check');
    return !error;
  } catch {
    return false;
  }
};

module.exports = { 
  supabase, 
  testConnection,
  checkHealth
};