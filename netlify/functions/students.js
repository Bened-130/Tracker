import { supabase } from './utils/supabase.mjs';
import { verifyToken } from './utils/auth.mjs';
import { averageDescriptors } from './utils/math.mjs';

export async function studentsHandler(event, context) {
  const method = event.httpMethod;
  const path = event.path;
  const segments = path.split('/').filter(Boolean);
  const id = segments[2];

  try {
    // GET /api/students
    if (method === 'GET' && !id) {
      const { data, error, count } = await supabase
        .from('students')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data, count })
      };
    }

    // GET /api/students/:id
    if (method === 'GET' && id) {
      const { data, error } = await supabase
        .from('students')
        .select('*, attendance(*)')
        .eq('student_id', id)
        .single();

      if (error) throw error;
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data })
      };
    }

    // POST /api/students - Register
    if (method === 'POST') {
      const body = JSON.parse(event.body);
      const { first_name, last_name, email, class_id, face_descriptors } = body;

      // Validation
      if (!first_name || !last_name || !email || !face_descriptors?.length) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      // Check if email exists
      const { data: existing } = await supabase
        .from('students')
        .select('student_id')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        return {
          statusCode: 409,
          body: JSON.stringify({ error: 'Email already registered' })
        };
      }

      // Average the face descriptors
      const avgDescriptor = averageDescriptors(face_descriptors);

      // Insert student
      const { data, error } = await supabase
        .from('students')
        .insert([{
          first_name,
          last_name,
          email,
          class_id: class_id || null,
          face_descriptor: avgDescriptor
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 201,
        body: JSON.stringify({ success: true, data, message: 'Student registered' })
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Students handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}