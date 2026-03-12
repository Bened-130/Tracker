// backend/controllers/studentController.js
// Student registration and management

const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const faceRecognition = require('../services/faceRecognition');

// Register new student with face descriptors
exports.registerStudent = asyncHandler(async (req, res) => {
    const { first_name, last_name, email, class_id, face_descriptors } = req.body;

    // Validate face descriptors
    if (!Array.isArray(face_descriptors) || face_descriptors.length < 5) {
        return res.status(400).json({
            error: 'At least 5 face descriptors required'
        });
    }

    // Validate each descriptor is 128-dimensional
    for (const desc of face_descriptors) {
        if (!Array.isArray(desc) || desc.length !== 128) {
            return res.status(400).json({
                error: 'Invalid face descriptor format. Expected 128-dimensional array'
            });
        }
    }

    // Compute average descriptor from multiple photos
    const averagedDescriptor = faceRecognition.computeAverageDescriptor(face_descriptors);

    // Insert student into database
    const { data: student, error } = await supabase
        .from('students')
        .insert([{
            first_name,
            last_name,
            email,
            face_descriptors: JSON.stringify(averagedDescriptor),
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;

    // Enroll in class if provided
    if (class_id) {
        const { error: enrollError } = await supabase
            .from('enrollments')
            .insert([{
                student_id: student.student_id,
                class_id,
                enrolled_at: new Date().toISOString()
            }]);
        
        if (enrollError) console.error('Enrollment error:', enrollError);
    }

    res.status(201).json({
        success: true,
        data: {
            student_id: student.student_id,
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.email
        }
    });
});

// Get all students
exports.getStudents = asyncHandler(async (req, res) => {
    const { class_id, search, limit = 50, offset = 0 } = req.query;

    let query = supabase
        .from('students')
        .select('student_id, first_name, last_name, email, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: students, error, count } = await query;

    if (error) throw error;

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
            *,
            attendance:attendance (
                session_id,
                status,
                timestamp,
                facial_confidence,
                sessions:session_id (
                    session_date,
                    classes:class_id (class_name)
                )
            )
        `)
        .eq('student_id', id)
        .single();

    if (error) throw error;
    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }

    // Remove sensitive face descriptor data for non-admin
    if (req.user?.role !== 'admin') {
        delete student.face_descriptors;
    }

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

    if (error) throw error;

    res.json({
        success: true,
        message: 'Student deleted successfully'
    });
});