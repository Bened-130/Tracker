// backend/controllers/attendanceController.js
// Attendance with anon key and RLS handling

const { supabase, isRLSError } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const faceRecognition = require('../services/faceRecognition');

// Mark attendance with face verification
exports.markAttendance = asyncHandler(async (req, res) => {
  const { session_id, face_descriptor } = req.body;

  if (!session_id || !face_descriptor) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Session ID and face descriptor required'
    });
  }

  // Get session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('session_id, class_id, session_date, start_time, end_time')
    .eq('session_id', session_id)
    .single();

  if (sessionError || !session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Get active students with face data
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('student_id, first_name, last_name, face_descriptors, is_active')
    .eq('is_active', true)
    .not('face_descriptors', 'is', null);

  if (fetchError) {
    if (isRLSError(fetchError)) {
      return res.status(403).json({
        error: 'RLS Policy Violation',
        message: 'Cannot read student face data. Check SELECT policies.'
      });
    }
    throw fetchError;
  }

  // Find matching face
  const matchResult = faceRecognition.findBestMatch(face_descriptor, students);

  if (!matchResult.match) {
    return res.status(404).json({
      error: 'No Match',
      message: 'Face not recognized',
      confidence: matchResult.confidence
    });
  }

  const student = matchResult.match;
  const confidence = matchResult.confidence;

  // Check if already marked
  const { data: existing, error: checkError } = await supabase
    .from('attendance')
    .select('*')
    .eq('session_id', session_id)
    .eq('student_id', student.student_id)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existing) {
    return res.status(409).json({
      error: 'Already Checked In',
      data: {
        student_id: student.student_id,
        name: `${student.first_name} ${student.last_name}`,
        status: existing.status,
        timestamp: existing.timestamp
      }
    });
  }

  // Determine status (late if > 15 min after start)
  const now = new Date();
  const [startHour, startMin] = session.start_time.split(':').map(Number);
  const sessionStart = new Date(session.session_date);
  sessionStart.setHours(startHour, startMin, 0);
  
  const lateThreshold = new Date(sessionStart.getTime() + 15 * 60000);
  const status = now > lateThreshold ? 'late' : 'present';

  // Insert attendance
  const { data: attendance, error: insertError } = await supabase
    .from('attendance')
    .insert([{
      session_id: parseInt(session_id),
      student_id: student.student_id,
      status,
      timestamp: now.toISOString(),
      facial_confidence: confidence,
      verification_method: 'facial_recognition'
    }])
    .select()
    .single();

  if (insertError) {
    if (isRLSError(insertError)) {
      return res.status(403).json({
        error: 'RLS Policy Violation',
        message: 'Cannot insert attendance. Check INSERT policies.'
      });
    }
    throw insertError;
  }

  res.status(201).json({
    success: true,
    message: `Welcome ${student.first_name}! You are ${status}.`,
    data: {
      student_id: student.student_id,
      name: `${student.first_name} ${student.last_name}`,
      status,
      confidence,
      timestamp: attendance.timestamp
    }
  });
});

// Get session attendance
exports.getSessionAttendance = asyncHandler(async (req, res) => {
  const { session_id } = req.params;

  const { data: attendance, error } = await supabase
    .from('attendance')
    .select(`
      student_id,
      status,
      timestamp,
      facial_confidence,
      verification_method,
      students:student_id (first_name, last_name, email)
    `)
    .eq('session_id', session_id)
    .order('timestamp', { ascending: true });

  if (error) {
    if (isRLSError(error)) {
      return res.status(403).json({
        error: 'RLS Policy Violation',
        message: 'Cannot read attendance records. Check SELECT policies.'
      });
    }
    throw error;
  }

  res.json({
    success: true,
    count: attendance.length,
    data: attendance
  });
});