import { studentsHandler } from './students.mjs';
import { attendanceHandler } from './attendance.mjs';
import { classesHandler } from './classes.mjs';
import { reportsHandler } from './reports.mjs';
import { checkSupabaseConnection } from './utils/supabase.mjs';

const getHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
});

export const handler = async (event, context) => {
  // CRITICAL: Must return a response in ALL code paths
  context.callbackWaitsForEmptyEventLoop = false;
  
  const headers = getHeaders();

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ status: 'ok' }) // Must have body
    };
  }

  // Parse path
  let path = event.path || '';
  path = path.replace('/.netlify/functions/api', '').replace('/api', '');
  const segments = path.split('/').filter(Boolean);
  const endpoint = segments[0] || 'health';

  console.log('API Request:', { 
    method: event.httpMethod, 
    path: event.path,
    endpoint,
    segments
  });

  try {
    let result;

    switch (endpoint) {
      case 'health':
        const dbHealthy = await checkSupabaseConnection();
        result = {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true,
            status: 'ok', 
            timestamp: new Date().toISOString(),
            database: dbHealthy ? 'connected' : 'disconnected'
          })
        };
        break;

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
        result = {
          statusCode: 404,
          body: JSON.stringify({ 
            success: false,
            error: 'Endpoint not found',
            requested: endpoint
          })
        };
    }

    // CRITICAL: Ensure we always return headers
    return { 
      statusCode: result.statusCode || 500, 
      headers, 
      body: result.body || JSON.stringify({ error: 'Empty response' })
    };

  } catch (error) {
    console.error('CRITICAL API Error:', error);
    // CRITICAL: Must return valid response even on error
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      })
    };
  }
};