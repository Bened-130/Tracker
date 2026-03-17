import { supabase } from './utils/supabase.mjs';
import { verifyToken } from './utils/auth.mjs';

export async function classesHandler(event, context) {
  const method = event.httpMethod;
  const path = event.path || '';
  const segments = path.split('/').filter(Boolean);
  const id = segments[2];

  console.log('Classes handler:', { method, path, id });

  try {
    // GET /api/classes - List all classes
    if (method === 'GET' && !id) {
      console.log('Fetching classes from Supabase...');
      
      const { data, error, count } = await supabase
        .from('classes')
        .select('*', { count: 'exact' });

      if (error) {
        console.error('Supabase error:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            success: false,
            error: 'Database error', 
            details: error.message 
          })
        };
      }

      console.log('Classes fetched:', data?.length || 0);

      // CRITICAL: Always return valid JSON body
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          data: data || [],
          count: count || 0
        })
      };
    }

    // GET /api/classes/:id
    if (method === 'GET' && id) {
      const { data, error } = await supabase
        .from('classes')
        .select('*, sessions(*)')
        .eq('class_id', id)
        .single();

      if (error) {
        return {
          statusCode: 404,
          body: JSON.stringify({ 
            success: false,
            error: 'Class not found',
            details: error.message
          })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data })
      };
    }

    // POST /api/classes
    if (method === 'POST') {
      const user = verifyToken(event.headers.authorization);
      if (!user || user.role !== 'teacher') {
        return {
          statusCode: 403,
          body: JSON.stringify({ 
            success: false,
            error: 'Unauthorized' 
          })
        };
      }

      let body;
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            success: false,
            error: 'Invalid JSON' 
          })
        };
      }

      const { data, error } = await supabase
        .from('classes')
        .insert([body])
        .select()
        .single();

      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            success: false,
            error: 'Insert failed',
            details: error.message
          })
        };
      }

      return {
        statusCode: 201,
        body: JSON.stringify({ success: true, data })
      };
    }

    // Default: method not allowed
    return {
      statusCode: 405,
      body: JSON.stringify({ 
        success: false,
        error: 'Method not allowed',
        method: method
      })
    };

  } catch (error) {
    console.error('Classes handler error:', error);
    // CRITICAL: Always return valid response
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal error',
        message: error.message
      })
    };
  }
}