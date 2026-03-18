import { supabase } from './utils/supabase.mjs';

function averageDescriptors(descriptors) {
  if (!descriptors || descriptors.length === 0) return null;
  const length = descriptors[0].length;
  const avg = new Array(length).fill(0);
  for (const desc of descriptors) {
    for (let i = 0; i < length; i++) avg[i] += desc[i];
  }
  return avg.map(v => v / descriptors.length);
}

export async function studentsHandler(event) {
  const method = event.httpMethod;

  if (method === 'GET') {
    const { data, error } = await supabase.from('students').select('*');
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify({ success: true, data: data || [] }) };
  }

  if (method === 'POST') {
    const body = JSON.parse(event.body);
    const { first_name, last_name, email, class_id, face_descriptors } = body;

    if (!first_name || !last_name || !email || !face_descriptors?.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
    }

    const avgDescriptor = averageDescriptors(face_descriptors);

    const { data, error } = await supabase.from('students').insert([{
      first_name, last_name, email, class_id, face_descriptor: avgDescriptor
    }]).select().single();

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 201, body: JSON.stringify({ success: true, data }) };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
}