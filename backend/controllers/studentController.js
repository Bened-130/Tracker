// backend/controllers/studentController.js
// Student registration and management

const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const faceRecognition = require('../services/faceRecognition');

// Register new student with face descriptors
exports.registerStudent = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, student_number, class_id, face_descriptors } = req.body;

  // Validation
  if (!first_name || !last_name || !email) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'First name, last name, and email are required'
    });
  }

  if (!Array.isArray(face_descriptors) || face_descriptors.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'At least one face descriptor is required'
    });
  }

  // Validate each descriptor
  for (let i = 0; i < face_descriptors.length; i++) {
    const validation = faceRecognition.validateDescriptor(
      Array.isArray(face_descriptors[i]) ? face_descriptors[i] : face_descriptors[i].descriptor
    );
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid face descriptor at index ${i}: ${validation.error}`
      });
    }
  }

  // Compute average descriptor from multiple photos
  let averagedDescriptor;
  try {
    averagedDescriptor = faceRecognition.computeAverageDescriptor(face_descriptors);
  } catch (error) {
    return res.status(400).json({
      error: 'Processing Error',
      message: error.message
    });
  }

  // Insert student into database
  const { data: student, error } = await supabase
    .from('students')
    .insert([{
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.toLowerCase().trim(),
      student_number: student_number || null,
      face_descriptors: averagedDescriptor,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A student with this email already exists'
      });
    }
    throw error;
  }

  // Enroll in class if provided
  let enrollment = null;
  if (class_id) {
    const { data: enroll, error: enrollError } = await supabase
      .from('enrollments')
      .insert([{
        student_id: student.student_id,
        class_id: parseInt(class_id),
        enrolled_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (!enrollError) {
      enrollment = enroll;
    }
  }

  res.status(201).json({
    success: true,
    message: 'Student registered successfully',
    data: {
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      student_number: student.student_number,
      enrollment: enrollment
    }
  });
});

// Get all students with pagination and search
exports.getStudents = asyncHandler(async (req, res) => {
  const { 
    class_id, 
    search, 
    is_active = true,
    limit = 50, 
    offset = 0,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = req.query;

  let query = supabase
    .from('students')
    .select(`
      student_id,
      first_name,
      last_name,
      email,
      student_number,
      is_active,
      created_at,
      updated_at,
      enrollments:class_id (
        class_id,
        classes:class_id (class_name)
      )
    `, { count: 'exact' });

  // Filters
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }

  if (class_id) {
    query = query.eq('enrollments.class_id', class_id);
  }

  if (search) {
    const searchTerm = search.trim();
    query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,student_number.ilike.%${searchTerm}%`);
  }

  // Sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' });

  // Pagination
  const from = parseInt(offset);
  const to = from + parseInt(limit) - 1;
  query = query.range(from, to);

  const { data: students, error, count } = await query;

  if (error) throw error;

  res.json({
    success: true,
    count,
    pagination: {
      limit: parseInt(limit),
      offset: from,
      has_more: count > to + 1
    },
    data: students
  });
});

// Get single student with attendance history
exports.getStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: student, error } = await supabase
    .from('students')
    .select(`
      student_id,
      first_name,
      last_name,
      email,
      student_number,
      photo_url,
      is_active,
      created_at,
      updated_at,
      enrollments (
        enrollment_id,
        enrolled_at,
        classes:class_id (
          class_id,
          class_name,
          room_number
        )
      ),
      attendance (
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
      )
    `)
    .eq('student_id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
    }
    throw error;
  }

  // Calculate attendance stats
  const attendanceRecords = student.attendance || [];
  const totalSessions = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
  const lateCount = attendanceRecords.filter(a => a.status === 'late').length;
  const absentCount = attendanceRecords.filter(a => a.status === 'absent').length;
  
  const attendanceRate = totalSessions > 0 
    ? ((presentCount + lateCount) / totalSessions * 100).toFixed(1)
    : 0;

  // Remove sensitive face descriptor data
  delete student.face_descriptors;

  res.json({
    success: true,
    data: {
      ...student,
      stats: {
        total_sessions: totalSessions,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        attendance_rate: parseFloat(attendanceRate)
      }
    }
  });
});

// Update student
exports.updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Prevent updating sensitive fields directly
  delete updates.student_id;
  delete updates.created_at;
  delete updates.face_descriptors; // Use separate endpoint for face updates

  updates.updated_at = new Date().toISOString();

  const { data: student, error } = await supabase
    .from('students')
    .update(updates)
    .eq('student_id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
    }
    throw error;
  }

  res.json({
    success: true,
    message: 'Student updated successfully',
    data: student
  });
});

// Update face descriptors
exports.updateFaceDescriptors = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { face_descriptors } = req.body;

  if (!Array.isArray(face_descriptors) || face_descriptors.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'At least one face descriptor required'
    });
  }

  const averagedDescriptor = faceRecognition.computeAverageDescriptor(face_descriptors);

  const { data: student, error } = await supabase
    .from('students')
    .update({
      face_descriptors: averagedDescriptor,
      updated_at: new Date().toISOString()
    })
    .eq('student_id', id)
    .select('student_id, first_name, last_name, updated_at')
    .single();

  if (error) throw error;

  res.json({
    success: true,
    message: 'Face data updated successfully',
    data: student
  });
});

// Soft delete student (deactivate)
exports.deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permanent } = req.query;

  if (permanent === 'true') {
    // Hard delete
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('student_id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Student permanently deleted'
    });
  } else {
    // Soft delete (deactivate)
    const { data: student, error } = await supabase
      .from('students')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('student_id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Student deactivated successfully',
      data: student
    });
  }
});