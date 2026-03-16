// Main API router for Netlify Functions
import { studentsHandler } from './students.mjs';
import { attendanceHandler } from './attendance.mjs';
import { classesHandler } from './classes.mjs';
import { reportsHandler } from './reports.mjs';
import { checkSupabaseConnection } from './utils/supabase.mjs';

// CORS headers
const getHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
});

export const handler = async (event, context) => {
  // Keep function warm
  context.callbackWaitsForEmptyEventLoop = false;
  
  const headers = getHeaders();

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Parse path
  const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '');
  const segments = path.split('/').filter(Boolean);

  try {
    // Health check endpoint
    if (segments[0] === 'health') {
      const dbHealthy = await checkSupabaseConnection();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          database: dbHealthy ? 'connected' : 'disconnected'
        })
      };
    }

    // Route handlers
    let result;
    switch (segments[0]) {
      case 'students':
        result = await studentsHandler(event, context);
        break;
      case 'attendance':
        result = await attendanceHandler(event, context);
        break;
      case 'classes':
        result = await classesHandler(event, context);
        break;
      case 'reports':
        result = await reportsHandler(event, context);
        break;
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint not found' })
        };
    }

    return { ...result, headers };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};