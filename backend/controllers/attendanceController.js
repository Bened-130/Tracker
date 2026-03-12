// backend/controllers/attendanceController.js
// Attendance marking with face verification

const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const faceRecognition = require('../services/faceRecognition');

// Mark attendance with face verification
exports.markAttendance = asyncHandler(async (req, res) => {
    const { session_id, face_descriptor } = req.body;

    // Validate face descriptor
    if (!face_descriptor || !Array.isArray(face_descriptor) || face_descriptor.length !== 128) {
        return res.status(400).json({
            error: 'Valid 128-dimensional face descriptor required'
        });
    }

    // Get all students with face descriptors from database
    const { data: students, error: fetchError } = await supabase
        .from('students')
        .select('student_id, first_name, last_name, face_descriptors')
        .not('face_descriptors', 'is', null);

    if (fetchError) throw fetchError;

    // Find best matching student
    const match = faceRecognition.findBestMatch(face_descriptor, students);

    // No match found or confidence too low
    if (!match || match.distance >= 0.6) {
        return res.status(404).json({
            error: 'No matching student found',
            confidence: match ? (1 - match.distance).toFixed(4) : 0,
            threshold: 0.6
        });
    }

    const student = match.student;
    const confidence = parseFloat((1 - match.distance).toFixed(4));

    // Check if already marked for this session
    const { data: existing, error: checkError } = await supabase
        .from('attendance')
        .select('*')
        .eq('session_id', session_id)
        .eq('student_id', student.student_id)
        .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existing) {
        return res.status(409).json({
            error: 'Attendance already marked for this session',
            data: {
                student_id: student.student_id,
                name: `${student.first_name} ${student.last_name}`,
                status: existing.status,
                timestamp: existing.timestamp
            }
        });
    }

    // Determine if late (15 minutes after start)
    const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('start_time, end_time')
        .eq('session_id', session_id)
        .single();

    if (sessionError) throw sessionError;

    const now = new Date();
    const sessionStart = new Date(`${now.toDateString()} ${session.start_time}`);
    const status = now > new Date(sessionStart.getTime() + 15 * 60000) ? 'late' : 'present';

    // Insert attendance record
    const { data: attendance, error: insertError } = await supabase
        .from('attendance')
        .insert([{
            session_id,
            student_id: student.student_id,
            status,
            timestamp: now.toISOString(),
            facial_confidence: confidence,
            verification_method: 'facial_recognition'
        }])
        .select()
        .single();

    if (insertError) throw insertError;

    // Broadcast to realtime channel
    await supabase.channel('attendance_updates').send({
        type: 'broadcast',
        event: 'new_attendance',
        payload: {
            student_id: student.student_id,
            name: `${student.first_name} ${student.last_name}`,
            status,
            confidence,
            timestamp: now.toISOString()
        }
    });

    res.status(201).json({
        success: true,
        data: {
            student_id: student.student_id,
            name: `${student.first_name} ${student.last_name}`,
            status,
            confidence,
            timestamp: attendance.timestamp
        }
    });
});

// Get attendance for a session
exports.getSessionAttendance = asyncHandler(async (req, res) => {
    const { session_id } = req.params;

    const { data: attendance, error } = await supabase
        .from('attendance')
        .select(`
            student_id,
            status,
            timestamp,
            facial_confidence,
            students:student_id (first_name, last_name, email)
        `)
        .eq('session_id', session_id)
        .order('timestamp', { ascending: true });

    if (error) throw error;

    res.json({
        success: true,
        count: attendance.length,
        data: attendance
    });
});