// backend/config/database.js
// This file connects your backend to Supabase PostgreSQL

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Validate credentials exist
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!');
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in environment variables');
    process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    },
    db: {
        schema: 'public'
    }
});

// Test connection function
const testConnection = async () => {
    try {
        const { data, error } = await supabase.from('students').select('count');
        if (error) throw error;
        console.log('✅ Database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

module.exports = { supabase, testConnection };