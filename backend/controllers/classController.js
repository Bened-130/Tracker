// backend/controllers/classController.js
// Class and session management

const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getClasses = asyncHandler(async (req, res) => {
    const { data: classes, error } = await supabase
        .from('classes')
        .select('class_id, class_name, description, room_number')
        .eq('is_active', true)
        .order('class_name');

    if (error) throw error;

    res.json({
        success: true,
        data: classes
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