// backend/controllers/classController.js
// Class and session management

const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all classes
exports.getClasses = asyncHandler(async (req, res) => {
  const { is_active = true, teacher_id } = req.query;

  let query = supabase
    .from('classes')
    .select(`
      class_id,
      class_name,
      description,
      room_number,
      schedule,
      is_active,
      created_at,
      users:teacher_id (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .order('class_name');

  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }

  if (teacher_id) {
    query = query.eq('teacher_id', teacher_id);
  }

  const { data: classes, error } = await query;

  if (error) throw error;

  res.json({
    success: true,
    count: classes.length,
    data: classes
  });
});

// Get single class with enrollments
exports.getClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: classData, error } = await supabase
    .from('classes')
    .select(`
      *,
      users:teacher_id (id, first_name, last_name, email),
      enrollments (
        student_id,
        enrolled_at,
        students:student_id (student_id, first_name, last_name, email)
      )
    `)
    .eq('class_id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Not Found', message: 'Class not found' });
    }
    throw error;
  }

  res.json({
    success: true,
    data: classData
  });
});

// Create new class
exports.createClass = asyncHandler(async (req, res) => {
  const { class_name, description, teacher_id, room_number, schedule } = req.body;

  if (!class_name) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Class name is required'
    });
  }

  const { data: classData, error } = await supabase
    .from('classes')
    .insert([{
      class_name: class_name.trim(),
      description: description || null,
      teacher_id: teacher_id || null,
      room_number: room_number || null,
      schedule: schedule || null,
      is_active: true,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;

  res.status(201).json({
    success: true,
    message: 'Class created successfully',
    data: classData
  });
});

// Create new session for a class
exports.createSession = asyncHandler(async (req, res) => {
  const { class_id, session_date, start_time, end_time, notes } = req.body;

  // Validation
  if (!class_id || !session_date || !start_time || !end_time) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Class ID, session date, start time, and end time are required'
    });
  }

  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid time format. Use HH:MM or HH:MM:SS'
    });
  }

  // Check for overlapping sessions
  const { data: existingSessions, error: checkError } = await supabase
    .from('sessions')
    .select('session_id, start_time, end_time')
    .eq('class_id', class_id)
    .eq('session_date', session_date);

  if (checkError) throw checkError;

  const hasOverlap = existingSessions.some(session => {
    return (start_time < session.end_time && end_time > session.start_time);
  });

  if (hasOverlap) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Overlapping session exists for this class and date'
    });
  }

  const { data: session, error } = await supabase
    .from('sessions')
    .insert([{
      class_id: parseInt(class_id),
      session_date,
      start_time,
      end_time,
      notes: notes || null,
      created_at: new Date().toISOString()
    }])
    .select(`
      *,
      classes:class_id (class_name)
    `)
    .single();

  if (error) throw error;

  res.status(201).json({
    success: true,
    message: 'Session created successfully',
    data: session
  });
});

// Get sessions for a class
exports.getSessions = asyncHandler(async (req, res) => {
  const { class_id } = req.params;
  const { start_date, end_date, limit = 50 } = req.query;

  let query = supabase
    .from('sessions')
    .select(`
      session_id,
      session_date,
      start_time,
      end_time,
      notes,
      created_at,
      attendance (count)
    `)
    .eq('class_id', class_id)
    .order('session_date', { ascending: false })
    .limit(parseInt(limit));

  if (start_date) {
    query = query.gte('session_date', start_date);
  }

  if (end_date) {
    query = query.lte('session_date', end_date);
  }

  const { data: sessions, error } = await query;

  if (error) throw error;

  res.json({
    success: true,
    class_id: parseInt(class_id),
    count: sessions.length,
    data: sessions
  });
});

// Get today's sessions
exports.getTodaySessions = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      session_id,
      session_date,
      start_time,
      end_time,
      classes:class_id (
        class_id,
        class_name,
        room_number
      )
    `)
    .eq('session_date', today)
    .order('start_time');

  if (error) throw error;

  res.json({
    success: true,
    date: today,
    count: sessions.length,
    data: sessions
  });
});