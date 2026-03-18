import { supabase } from './utils/supabase.mjs';

const THRESHOLD = 0.6;

function euclideanDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

export async function attendanceHandler(event) {
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};

  if (method === 'POST' && event.path.includes('/mark')) {
    const { session_id, face_descriptor } = body;
    if (!session_id || !face_descriptor) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing data' }) };
    }

    const { data: students, error } = await supabase.from('students').select('*');
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

    let bestMatch = null;
    let minDist = Infinity;

    for (const s of students) {
      if (!s.face_descriptor) continue;
      const dist = euclideanDistance(face_descriptor, s.face_descriptor);
      if (dist < minDist) {
        minDist = dist;
        bestMatch = s;
      }
    }

    if (!bestMatch || minDist > THRESHOLD) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Face not recognized' }) };
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase.from('attendance').select('*')
      .eq('student_id', bestMatch.student_id)
      .eq('session_id', session_id)
      .gte('timestamp', today)
      .maybeSingle();

    if (existing) {
      return { statusCode: 409, body: JSON.stringify({ error: 'Already checked in' }) };
    }

    const { data: session } = await supabase.from('sessions').select('start_time').eq('session_id', session_id).single();
    const now = new Date();
    const start = new Date(`${today}T${session.start_time}`);
    const status = now > new Date(start.getTime() + 15 * 60000) ? 'late' : 'present';

    const { data, error: err } = await supabase.from('attendance').insert([{
      student_id: bestMatch.student_id,
      session_id,
      status,
      timestamp: now.toISOString()
    }]).select().single();

    if (err) return { statusCode: 500, body: JSON.stringify({ error: err.message }) };

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          name: `${bestMatch.first_name} ${bestMatch.last_name}`,
          status,
          timestamp: data.timestamp
        }
      })
    };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
}