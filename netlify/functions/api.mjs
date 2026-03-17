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
  context.callbackWaitsForEmptyEventLoop = false;
  
  const headers = getHeaders();

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ status: 'ok' })
    };
  }

  // Parse path
  let path = event.path || '';
  path = path.replace('/.netlify/functions/api', '').replace('/api', '');
  const segments = path.split('/').filter(Boolean);
  const endpoint = segments[0] || 'health';

  console.log('API Request:', { method: event.httpMethod, endpoint });

  try {
    let result;

    switch (endpoint) {
      case 'health':
        const dbCheck = await checkSupabaseConnection();
        result = {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true,
            status: 'ok', 
            timestamp: new Date().toISOString(),
            database: dbCheck.connected ? 'connected' : 'disconnected',
            dbError: dbCheck.error || null
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
            error: 'Endpoint not found'
          })
        };
    }

    return { 
      statusCode: result.statusCode || 500, 
      headers, 
      body: typeof result.body === 'string' ? result.body : JSON.stringify(result.body)
    };

  } catch (error) {
    console.error('CRITICAL ERROR:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};