// backend/controllers/studentController.js
// Student management using Supabase Anon Key

const { supabase, isRLSError } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const faceRecognition = require('../services/faceRecognition');

// Register new student
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
      message: 'At least one face descriptor required'
    });
  }

  // Compute average descriptor
  let averagedDescriptor;
  try {
    averagedDescriptor = faceRecognition.computeAverageDescriptor(face_descriptors);
  } catch (error) {
    return res.status(400).json({
      error: 'Processing Error',
      message: error.message
    });
  }

  // Insert student
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
    // Check for RLS error
    if (isRLSError(error)) {
      return res.status(403).json({
        error: 'RLS Policy Violation',
        message: 'Anonymous inserts blocked. Check RLS policies.',
        fix: 'Enable INSERT policy for anon role on students table'
      });
    }
    
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Student with this email already exists'
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
    
    if (!enrollError) enrollment = enroll;
  }

  res.status(201).json({
    success: true,
    message: 'Student registered successfully',
    data: {
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      enrollment
    }
  });
});

// Get all students
exports.getStudents = asyncHandler(async (req, res) => {
  const { search, is_active = true, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('students')
    .select('student_id, first_name, last_name, email, student_number, is_active, created_at', { 
      count: 'exact' 
    })
    .order('created_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }

  if (search) {
    const term = search.trim();
    query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data: students, error, count } = await query;

  if (error) {
    if (isRLSError(error)) {
      return res.status(403).json({
        error: 'RLS Policy Violation',
        message: 'Anonymous selects blocked. Check SELECT policies.'
      });
    }
    throw error;
  }

  res.json({
    success: true,
    count,
    data: students
  });
});

// Get single student
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
      is_active,
      created_at,
      attendance (
        session_id,
        status,
        timestamp,
        sessions:session_id (session_date, classes:class_id (class_name))
      )
    `)
    .eq('student_id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Student not found' });
    }
    throw error;
  }

  // Remove sensitive data
  delete student.face_descriptors;

  res.json({
    success: true,
    data: student
  });
});

// Delete student
exports.deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('student_id', id);

  if (error) {
    if (isRLSError(error)) {
      return res.status(403).json({
        error: 'RLS Policy Violation',
        message: 'Anonymous deletes blocked. Check DELETE policies.'
      });
    }
    throw error;
  }

  res.json({
    success: true,
    message: 'Student deleted successfully'
  });
});