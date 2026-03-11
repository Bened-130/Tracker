const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const faceRecognition = require('../services/faceRecognition');

exports.registerStudent = asyncHandler(async (req, res) => {
    const { first_name, last_name, email, class_id, face_descriptors } = req.body;

    if (!Array.isArray(face_descriptors) || face_descriptors.length < 5) {
        return res.status(400).json({
            error: 'At least 5 face descriptors required'
        });
    }

    for (const desc of face_descriptors) {
        if (!Array.isArray(desc) || desc.length !== 128) {
            return res.status(400).json({
                error: 'Invalid face descriptor format. Expected 128-dimensional array'
            });
        }
    }

    const averagedDescriptor = faceRecognition.computeAverageDescriptor(face_descriptors);

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
            email: student.email,
            face_descriptor_sample: averagedDescriptor.slice(0, 5).map(d => d.toFixed(4)) + '...'
        }
    });
});

exports.getStudents = asyncHandler(async (req, res) => {
    const { class_id, search, limit = 50, offset = 0 } = req.query;

    let query = supabase
        .from('students')
        .select(`
            student_id,
            first_name,
            last_name,
            email,
            created_at,
            enrollments:class_id (class_id, classes:class_id (class_name))
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (class_id) {
        query = query.eq('enrollments.class_id', class_id);
    }

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

    if (req.user?.role !== 'admin') {
        delete student.face_descriptors;
    }

    res.json({
        success: true,
        data: student
    });
});

exports.updateStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    delete updates.face_descriptors;

    const { data: student, error } = await supabase
        .from('students')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('student_id', id)
        .select()
        .single();

    if (error) throw error;

    res.json({
        success: true,
        data: student
    });
});

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

exports.updateFaceDescriptors = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { face_descriptors } = req.body;

    if (!Array.isArray(face_descriptors) || face_descriptors.length < 5) {
        return res.status(400).json({
            error: 'At least 5 face descriptors required'
        });
    }

    const averagedDescriptor = faceRecognition.computeAverageDescriptor(face_descriptors);

    const { data: student, error } = await supabase
        .from('students')
        .update({
            face_descriptors: JSON.stringify(averagedDescriptor),
            updated_at: new Date().toISOString()
        })
        .eq('student_id', id)
        .select()
        .single();

    if (error) throw error;

    res.json({
        success: true,
        message: 'Face descriptors updated successfully'
    });
});