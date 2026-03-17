import { supabase } from './utils/supabase.mjs';

const THRESHOLD = 0.6;

function euclideanDistance(desc1, desc2) {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export async function attendanceHandler(event, context) {
  const method = event.httpMethod;
  const path = event.path || '';
  
  try {
    const body = event.body ? JSON.parse(event.body) : {};

    // POST /api/attendance/mark - Face recognition check-in
    if (method === 'POST' && path.includes('/mark')) {
      const { session_id, face_descriptor } = body;

      if (!session_id || !face_descriptor) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Session ID and face descriptor required' })
        };
      }

      // Get all students with face descriptors
      const { data: students, error } = await supabase
        .from('students')
        .select('student_id, first_name, last_name, face_descriptor');

      if (error) throw error;

      // Find best match
      let bestMatch = null;
      let minDistance = Infinity;

      for (const student of students) {
        if (!student.face_descriptor) continue;
        
        const distance = euclideanDistance(face_descriptor, student.face_descriptor);
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = student;
        }
      }

      if (!bestMatch || minDistance > THRESHOLD) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'No matching face found' })
        };
      }

      // Check if already checked in
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('attendance')
        .select('attendance_id')
        .eq('student_id', bestMatch.student_id)
        .eq('session_id', session_id)
        .gte('timestamp', today)
        .maybeSingle();

      if (existing) {
        return {
          statusCode: 409,
          body: JSON.stringify({ error: 'Already checked in today' })
        };
      }

      // Get session details for late calculation
      const { data: session } = await supabase
        .from('sessions')
        .select('start_time')
        .eq('session_id', session_id)
        .single();

      const now = new Date();
      const startTime = new Date(`${today}T${session.start_time}`);
      const status = now > new Date(startTime.getTime() + 15 * 60000) ? 'late' : 'present';

      // Create attendance record
      const { data: attendance, error: insertError } = await supabase
        .from('attendance')
        .insert([{
          student_id: bestMatch.student_id,
          session_id,
          status,
          timestamp: now.toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: {
            student_id: bestMatch.student_id,
            name: `${bestMatch.first_name} ${bestMatch.last_name}`,
            status,
            timestamp: attendance.timestamp
          }
        })
      };
    }

    // GET /api/attendance/session/:id
    if (method === 'GET' && path.includes('/session/')) {
      const sessionId = path.split('/').pop();
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*, students(first_name, last_name)')
        .eq('session_id', sessionId);

      if (error) throw error;

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data, count: data.length })
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Attendance error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}