// backend/controllers/attendanceController.js
// Attendance marking with face verification

const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const faceRecognition = require('../services/faceRecognition');

// Mark attendance with face verification
exports.markAttendance = asyncHandler(async (req, res) => {
  const { session_id, face_descriptor, verification_method = 'facial_recognition' } = req.body;

  // Validate inputs
  if (!session_id) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Session ID is required'
    });
  }

  if (!face_descriptor || !Array.isArray(face_descriptor)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Valid face descriptor array is required'
    });
  }

  if (face_descriptor.length !== 128) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Invalid face descriptor dimensions. Expected 128, got ${face_descriptor.length}`
    });
  }

  // Get session details
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('session_id, class_id, session_date, start_time, end_time')
    .eq('session_id', session_id)
    .single();

  if (sessionError || !session) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Session not found'
    });
  }

  // Check if session is still active
  const now = new Date();
  const sessionDate = new Date(session.session_date);
  const [startHour, startMin] = session.start_time.split(':').map(Number);
  const [endHour, endMin] = session.end_time.split(':').map(Number);
  
  const sessionStart = new Date(sessionDate);
  sessionStart.setHours(startHour, startMin, 0);
  
  const sessionEnd = new Date(sessionDate);
  sessionEnd.setHours(endHour, endMin, 0);

  // Allow check-in 30 minutes before start
  const earlyWindow = new Date(sessionStart.getTime() - 30 * 60000);
  
  if (now < earlyWindow) {
    return res.status(400).json({
      error: 'Too Early',
      message: 'Check-in not available yet. Please come back closer to session start time.'
    });
  }

  if (now > sessionEnd) {
    return res.status(400).json({
      error: 'Session Ended',
      message: 'This session has already ended'
    });
  }

  // Get all active students with face descriptors
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('student_id, first_name, last_name, face_descriptors, is_active')
    .eq('is_active', true)
    .not('face_descriptors', 'is', null);

  if (fetchError) throw fetchError;

  if (!students || students.length === 0) {
    return res.status(404).json({
      error: 'No Data',
      message: 'No students with face data found in system'
    });
  }

  // Find best matching student
  const matchResult = faceRecognition.findBestMatch(face_descriptor, students);

  // No match found or confidence too low
  if (!matchResult.match) {
    return res.status(404).json({
      error: 'No Match',
      message: 'No matching student found. Please try again or see administrator.',
      confidence: matchResult.confidence,
      threshold: faceRecognition.defaultThreshold,
      suggestion: matchResult.confidence > 0.5 
        ? 'Face detected but confidence too low. Please ensure good lighting.'
        : 'No matching face found in database.'
    });
  }

  const student = matchResult.match;
  const confidence = matchResult.confidence;

  // Check if already marked for this session
  const { data: existing, error: checkError } = await supabase
    .from('attendance')
    .select('status, timestamp, verification_method')
    .eq('session_id', session_id)
    .eq('student_id', student.student_id)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existing) {
    return res.status(409).json({
      error: 'Already Checked In',
      message: 'Attendance already recorded for this session',
      data: {
        student_id: student.student_id,
        name: `${student.first_name} ${student.last_name}`,
        status: existing.status,
        timestamp: existing.timestamp,
        verification_method: existing.verification_method
      }
    });
  }

  // Determine status based on arrival time
  const lateThreshold = new Date(sessionStart.getTime() + 15 * 60000); // 15 min grace period
  const status = now > lateThreshold ? 'late' : 'present';

  // Insert attendance record
  const { data: attendance, error: insertError } = await supabase
    .from('attendance')
    .insert([{
      session_id: parseInt(session_id),
      student_id: student.student_id,
      status,
      timestamp: now.toISOString(),
      facial_confidence: confidence,
      verification_method,
      marked_by: req.user?.id || null
    }])
    .select()
    .single();

  if (insertError) throw insertError;

  // Log successful recognition for analytics
  console.log(`✅ Attendance marked: ${student.first_name} ${student.last_name} (${status}) - Confidence: ${(confidence * 100).toFixed(1)}%`);

  res.status(201).json({
    success: true,
    message: `Welcome ${student.first_name}! You are ${status}.`,
    data: {
      student_id: student.student_id,
      name: `${student.first_name} ${student.last_name}`,
      status,
      confidence,
      timestamp: attendance.timestamp,
      session: {
        class_id: session.class_id,
        date: session.session_date,
        start_time: session.start_time
      }
    }
  });
});

// Manual attendance marking (for teachers)
exports.markManualAttendance = asyncHandler(async (req, res) => {
  const { session_id, student_id, status, reason } = req.body;

  if (!['present', 'absent', 'late', 'excused'].includes(status)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid status. Must be: present, absent, late, or excused'
    });
  }

  // Check for existing record
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('session_id', session_id)
    .eq('student_id', student_id)
    .maybeSingle();

  let attendance;
  
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('attendance')
      .update({
        status,
        reason: reason || existing.reason,
        marked_by: req.user?.id,
        verification_method: 'manual'
      })
      .eq('session_id', session_id)
      .eq('student_id', student_id)
      .select()
      .single();
    
    if (error) throw error;
    attendance = data;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('attendance')
      .insert([{
        session_id,
        student_id,
        status,
        timestamp: new Date().toISOString(),
        verification_method: 'manual',
        marked_by: req.user?.id,
        reason
      }])
      .select()
      .single();
    
    if (error) throw error;
    attendance = data;
  }

  res.json({
    success: true,
    message: 'Attendance updated successfully',
    data: attendance
  });
});

// Get attendance for a session
exports.getSessionAttendance = asyncHandler(async (req, res) => {
  const { session_id } = req.params;
  const { status, search } = req.query;

  let query = supabase
    .from('attendance')
    .select(`
      student_id,
      status,
      timestamp,
      facial_confidence,
      verification_method,
      reason,
      students:student_id (
        student_id,
        first_name,
        last_name,
        email,
        student_number
      )
    `)
    .eq('session_id', session_id)
    .order('timestamp', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`students.first_name.ilike.%${search}%,students.last_name.ilike.%${search}%`);
  }

  const { data: attendance, error, count } = await query;

  if (error) throw error;

  // Calculate statistics
  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    late: attendance.filter(a => a.status === 'late').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    excused: attendance.filter(a => a.status === 'excused').length,
    facial_recognition: attendance.filter(a => a.verification_method === 'facial_recognition').length,
    manual: attendance.filter(a => a.verification_method === 'manual').length
  };

  res.json({
    success: true,
    session_id: parseInt(session_id),
    stats,
    count: attendance.length,
    data: attendance
  });
});

// Get student's attendance history
exports.getStudentAttendance = asyncHandler(async (req, res) => {
  const { student_id } = req.params;
  const { start_date, end_date, limit = 50 } = req.query;

  let query = supabase
    .from('attendance')
    .select(`
      session_id,
      status,
      timestamp,
      facial_confidence,
      verification_method,
      sessions:session_id (
        session_date,
        start_time,
        classes:class_id (class_name)
      )
    `)
    .eq('student_id', student_id)
    .order('timestamp', { ascending: false })
    .limit(parseInt(limit));

  if (start_date) {
    query = query.gte('sessions.session_date', start_date);
  }

  if (end_date) {
    query = query.lte('sessions.session_date', end_date);
  }

  const { data: attendance, error } = await query;

  if (error) throw error;

  // Calculate streak
  let currentStreak = 0;
  let maxStreak = 0;
  
  for (const record of attendance) {
    if (record.status === 'present') {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  res.json({
    success: true,
    student_id: parseInt(student_id),
    streak: {
      current: currentStreak,
      max: maxStreak
    },
    count: attendance.length,
    data: attendance
  });
});