const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const faceRecognition = require('../services/faceRecognition');

exports.markAttendance = asyncHandler(async (req, res) => {
    const { session_id, face_descriptor } = req.body;

    if (!face_descriptor || !Array.isArray(face_descriptor) || face_descriptor.length !== 128) {
        return res.status(400).json({
            error: 'Valid 128-dimensional face descriptor required'
        });
    }

    const { data: students, error: fetchError } = await supabase
        .from('students')
        .select('student_id, first_name, last_name, face_descriptors')
        .not('face_descriptors', 'is', null);

    if (fetchError) throw fetchError;

    const match = faceRecognition.findBestMatch(face_descriptor, students);

    if (!match || match.distance >= 0.6) {
        return res.status(404).json({
            error: 'No matching student found',
            confidence: match ? (1 - match.distance).toFixed(4) : 0,
            threshold: 0.6
        });
    }

    const student = match.student;
    const confidence = parseFloat((1 - match.distance).toFixed(4));

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

    const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('start_time, end_time')
        .eq('session_id', session_id)
        .single();

    if (sessionError) throw sessionError;

    const now = new Date();
    const sessionStart = new Date(`${now.toDateString()} ${session.start_time}`);
    const status = now > new Date(sessionStart.getTime() + 15 * 60000) ? 'late' : 'present';

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
            attendance_id: `${session_id}-${student.student_id}`,
            student_id: student.student_id,
            name: `${student.first_name} ${student.last_name}`,
            status,
            confidence,
            timestamp: attendance.timestamp,
            match_distance: match.distance.toFixed(6)
        }
    });
});

exports.manualAttendance = asyncHandler(async (req, res) => {
    const { session_id, student_id, status, reason } = req.body;

    if (!['present', 'absent', 'late'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: attendance, error } = await supabase
        .from('attendance')
        .upsert([{
            session_id,
            student_id,
            status,
            timestamp: new Date().toISOString(),
            facial_confidence: null,
            verification_method: 'manual',
            marked_by: req.user.id,
            reason: reason || null
        }])
        .select()
        .single();

    if (error) throw error;

    res.json({
        success: true,
        data: attendance
    });
});

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

exports.getStudentAttendance = asyncHandler(async (req, res) => {
    const { student_id } = req.params;
    const { start_date, end_date } = req.query;

    let query = supabase
        .from('attendance')
        .select(`
            session_id,
            status,
            timestamp,
            facial_confidence,
            sessions:session_id (
                session_date,
                start_time,
                classes:class_id (class_name)
            )
        `)
        .eq('student_id', student_id);

    if (start_date) {
        query = query.gte('sessions.session_date', start_date);
    }
    if (end_date) {
        query = query.lte('sessions.session_date', end_date);
    }

    const { data: attendance, error } = await query.order('timestamp', { ascending: false });

    if (error) throw error;

    const stats = {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        late: attendance.filter(a => a.status === 'late').length,
        rate: attendance.length > 0 
            ? ((attendance.filter(a => a.status === 'present').length / attendance.length) * 100).toFixed(2)
            : 0
    };

    res.json({
        success: true,
        statistics: stats,
        data: attendance
    });
});