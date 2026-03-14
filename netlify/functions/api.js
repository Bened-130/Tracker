// Main API router for Netlify Functions
const { studentsHandler } = require('./students');
const { attendanceHandler } = require('./attendance');
const { classesHandler } = require('./classes');
const { reportsHandler } = require('./reports');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '');
  const segments = path.split('/').filter(Boolean);

  try {
    // Route to specific handlers
    if (segments[0] === 'students') {
      return await studentsHandler(event, context, headers);
    }
    if (segments[0] === 'attendance') {
      return await attendanceHandler(event, context, headers);
    }
    if (segments[0] === 'classes') {
      return await classesHandler(event, context, headers);
    }
    if (segments[0] === 'reports') {
      return await reportsHandler(event, context, headers);
    }
    if (segments[0] === 'health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};