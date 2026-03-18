import { supabase } from './utils/supabase.mjs';

export async function classesHandler(event, context) {
  const method = event.httpMethod;
  const path = event.path || '';
  const segments = path.split('/').filter(Boolean);
  const id = segments[2];

  console.log('Classes handler called:', { method, path, id });

  try {
    // GET /api/classes - List all classes
    if (method === 'GET' && !id) {
      console.log('Fetching all classes from Supabase...');
      
      const { data, error, count } = await supabase
        .from('classes')
        .select('*', { count: 'exact' });

      console.log('Supabase response:', { 
        hasData: !!data,
        dataLength: data?.length,
        hasError: !!error,
        errorMessage: error?.message,
        count: count
      });

      if (error) {
        console.error('Database error:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            success: false,
            error: 'Database query failed', 
            details: error.message,
            code: error.code
          })
        };
      }

      if (!data || data.length === 0) {
        console.log('No classes found in database');
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true, 
            data: [],
            count: 0,
            message: 'No classes found. Please run the SQL setup script.'
          })
        };
      }

      console.log('Successfully found', data.length, 'classes');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          data: data,
          count: data.length
        })
      };
    }

    // GET /api/classes/:id
    if (method === 'GET' && id) {
      console.log('Fetching class by ID:', id);
      
      const { data, error } = await supabase
        .from('classes')
        .select('*, sessions(*)')
        .eq('class_id', id)
        .single();

      if (error || !data) {
        console.log('Class not found:', id);
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
            error: 'Invalid JSON body' 
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
            error: 'Failed to create class',
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