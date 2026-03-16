import { supabase } from './utils/supabase.mjs';
import { verifyToken } from './utils/auth.mjs';

export async function classesHandler(event, context) {
  const method = event.httpMethod;
  const path = event.path;
  const segments = path.split('/').filter(Boolean);
  const id = segments[2];

  console.log('Classes handler called:', { method, path, id });

  try {
    // GET /api/classes - List all classes
    if (method === 'GET' && !id) {
      console.log('Fetching all classes...');
      
      const { data, error, count } = await supabase
        .from('classes')
        .select('*, sessions(*)', { count: 'exact' });

      if (error) {
        console.error('Supabase error fetching classes:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            success: false,
            error: 'Database error', 
            details: error.message 
          })
        };
      }

      console.log('Classes fetched:', data?.length, 'Count:', count);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          data: data || [],
          count: count || 0
        })
      };
    }

    // GET /api/classes/:id - Get single class
    if (method === 'GET' && id) {
      console.log('Fetching class:', id);
      
      const { data, error } = await supabase
        .from('classes')
        .select(`*, sessions(*), students:students(*)`)
        .eq('class_id', id)
        .single();

      if (error) {
        console.error('Supabase error fetching class:', error);
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

    // POST /api/classes - Create class (teacher only)
    if (method === 'POST') {
      const user = verifyToken(event.headers.authorization);
      if (!user || user.role !== 'teacher') {
        return {
          statusCode: 403,
          body: JSON.stringify({ 
            success: false,
            error: 'Unauthorized - Teacher access required' 
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
        console.error('Supabase error creating class:', error);
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
    console.error('Classes handler exception:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    };
  }
}