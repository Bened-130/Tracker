const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getClasses = asyncHandler(async (req, res) => {
    const { data: classes, error } = await supabase
        .from('classes')
        .select(`
            class_id,
            class_name,
            description,
            teacher_id,
            users:teacher_id (first_name, last_name),
            sessions (
                session_id,
                session_date,
                start_time,
                end_time
            )
        `)
        .order('class_name');

    if (error) throw error;

    res.json({
        success: true,
        data: classes
    });
});

exports.getClass = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { data: classData, error } = await supabase
        .from('classes')
        .select(`
            *,
            teacher:teacher_id (first_name, last_name, email),
            sessions (
                session_id,
                session_date,
                start_time,
                end_time,
                attendance (count)
            ),
            enrollments (
                student_id,
                students:student_id (first_name, last_name)
            )
        `)
        .eq('class_id', id)
        .single();

    if (error) throw error;
    if (!classData) {
        return res.status(404).json({ error: 'Class not found' });
    }

    res.json({
        success: true,
        data: classData
    });
});

exports.createClass = asyncHandler(async (req, res) => {
    const { class_name, description, teacher_id } = req.body;

    const { data: classData, error } = await supabase
        .from('classes')
        .insert([{
            class_name,
            description,
            teacher_id,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;

    res.status(201).json({
        success: true,
        data: classData
    });
});

exports.createSession = asyncHandler(async (req, res) => {
    const { class_id, session_date, start_time, end_time } = req.body;

    const { data: session, error } = await supabase
        .from('sessions')
        .insert([{
            class_id,
            session_date,
            start_time,
            end_time,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;

    res.status(201).json({
        success: true,
        data: session
    });
});