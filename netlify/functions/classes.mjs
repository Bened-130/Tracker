import { supabase } from './utils/supabase.mjs';

export async function classesHandler(event) {
  const method = event.httpMethod;
  const id = event.path.split('/')[3];

  console.log('Classes:', method, id);

  if (method === 'GET' && !id) {
    const { data, error } = await supabase.from('classes').select('*');
    
    if (error) {
      console.error('Error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    console.log('Found', data?.length, 'classes');
    return { 
      statusCode: 200, 
      body: JSON.stringify({ success: true, data: data || [], count: data?.length || 0 }) 
    };
  }

  if (method === 'GET' && id) {
    const { data, error } = await supabase.from('classes').select('*').eq('class_id', id).single();
    if (error || !data) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Class not found' }) };
    }
    return { statusCode: 200, body: JSON.stringify({ success: true, data }) };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
}