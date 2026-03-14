const { supabase, verifyToken } = require('./utils/supabase');

exports.classesHandler = async (event, context, headers) => {
  const method = event.httpMethod;
  const segments = event.path.split('/').filter(Boolean);
  const id = segments[2];

  // GET /api/classes
  if (method === 'GET' && !id) {
    const { data, error } = await supabase
      .from('classes')
      .select('*, sessions(*)');

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data, count: data.length })
    };
  }

  // GET /api/classes/:id
  if (method === 'GET' && id) {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        sessions(*),
        students:students(*)
      `)
      .eq('class_id', id)
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data })
    };
  }

  // POST /api/classes
  if (method === 'POST') {
    const user = verifyToken(event.headers.authorization);
    if (!user || user.role !== 'teacher') {
      return {
        statusCode: 403,
        headers,
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
      headers,
      body: JSON.stringify({ success: true, data })
    };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};