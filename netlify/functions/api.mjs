import { classesHandler } from './classes.mjs';
import { studentsHandler } from './students.mjs';
import { attendanceHandler } from './attendance.mjs';
import { checkSupabaseConnection } from './utils/supabase.mjs';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '{}' };
  }

  const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '');
  const endpoint = path.split('/')[1] || 'health';

  console.log('Request:', endpoint);

  try {
    let result;

    if (endpoint === 'health') {
      const db = await checkSupabaseConnection();
      result = {
        statusCode: 200,
        body: JSON.stringify({ success: true, database: db.connected ? 'connected' : 'disconnected', error: db.error })
      };
    }
    else if (endpoint === 'classes') {
      result = await classesHandler(event);
    }
    else if (endpoint === 'students') {
      result = await studentsHandler(event);
    }
    else if (endpoint === 'attendance') {
      result = await attendanceHandler(event);
    }
    else {
      result = { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
    }

    return { ...result, headers };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};