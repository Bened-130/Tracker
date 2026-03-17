import { supabase } from './utils/supabase.mjs';

export async function classesHandler(event, context) {
  const method = event.httpMethod;
  const path = event.path || '';
  const segments = path.split('/').filter(Boolean);
  const id = segments[2];

  console.log('Classes handler:', { method, id });

  try {
    // GET /api/classes - List all classes
    if (method === 'GET' && !id) {
      console.log('Fetching all classes...');
      
      const { data, error, count } = await supabase
        .from('classes')
        .select('*', { count: 'exact' });

      console.log('Supabase response:', { 
        dataLength: data?.length, 
        hasError: !!error,
        errorMsg: error?.message
      });

      if (error) {
        console.error('Database error:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            success: false,
            error: 'Database error', 
            details: error.message
          })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          data: data || [],
          count: data?.length || 0
        })
      };
    }

    // GET /api/classes/:id
    if (method === 'GET' && id) {
      console.log('Fetching class:', id);
      
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
            error: 'Class not found'
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

    return {
      statusCode: 405,
      body: JSON.stringify({ 
        success: false,
        error: 'Method not allowed'
      })
    };

  } catch (error) {
    console.error('Handler error:', error);
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