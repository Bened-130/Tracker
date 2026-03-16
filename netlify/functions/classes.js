import { supabase } from './utils/supabase.mjs';
import { verifyToken } from './utils/auth.mjs';

export async function classesHandler(event, context) {
  const method = event.httpMethod;
  const path = event.path;
  const segments = path.split('/').filter(Boolean);
  const id = segments[2];

  try {
    // GET /api/classes
    if (method === 'GET' && !id) {
      const { data, error } = await supabase
        .from('classes')
        .select('*, sessions(*)');

      if (error) throw error;

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data, count: data.length })
      };
    }

    // GET /api/classes/:id
    if (method === 'GET' && id) {
      const { data, error } = await supabase
        .from('classes')
        .select(`*, sessions(*), students:students(*)`)
        .eq('class_id', id)
        .single();

      if (error) throw error;

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
          body: JSON.stringify({ error: 'Unauthorized' })
        };
      }

      const body = JSON.parse(event.body);
      const { data, error } = await supabase
        .from('classes')
        .insert([body])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 201,
        body: JSON.stringify({ success: true, data })
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Classes handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}