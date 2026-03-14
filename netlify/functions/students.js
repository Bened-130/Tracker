const { supabase, verifyToken } = require('./utils/supabase');

exports.studentsHandler = async (event, context, headers) => {
  const user = verifyToken(event.headers.authorization);
  const method = event.httpMethod;
  const segments = event.path.split('/').filter(Boolean);
  const id = segments[2];

  // GET /api/students
  if (method === 'GET' && !id) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data, count: data.length })
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
      headers,
      body: JSON.stringify({ success: true, data })
    };
  }

  // POST /api/students - Register
  if (method === 'POST') {
    const body = JSON.parse(event.body);
    const { first_name, last_name, email, class_id, face_descriptors } = body;

    // Validate
    if (!first_name || !last_name || !email || !face_descriptors?.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Check if email exists
    const { data: existing } = await supabase
      .from('students')
      .select('student_id')
      .eq('email', email)
      .single();

    if (existing) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Email already registered' })
      };
    }

    // Average the face descriptors
    const avgDescriptor = face_descriptors[0].map((_, i) => {
      const sum = face_descriptors.reduce((acc, desc) => acc + desc[i], 0);
      return sum / face_descriptors.length;
    });

    // Insert student
    const { data, error } = await supabase
      .from('students')
      .insert([{
        first_name,
        last_name,
        email,
        class_id,
        face_descriptor: avgDescriptor
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ success: true, data, message: 'Student registered' })
    };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};