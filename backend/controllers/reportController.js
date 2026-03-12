// backend/controllers/reportController.js
// SQL reports for attendance analytics

const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

// Daily report using database function
exports.getDailyReport = asyncHandler(async (req, res) => {
    const { session_id } = req.params;

    const { data, error } = await supabase.rpc('get_daily_attendance', {
        p_session_id: parseInt(session_id)
    });

    if (error) throw error;

    res.json({
        success: true,
        query: 'SELECT c.class_name, COUNT(a.student_id) total, SUM(CASE WHEN status="present" THEN 1 ELSE 0 END) present, ROUND(100.0*present/total,2) pct FROM classes c JOIN sessions s ON c.class_id=s.class_id LEFT JOIN attendance a ON s.session_id=a.session_id WHERE s.session_id=$1 GROUP BY c.class_id',
        data: data
    });
});

// Class roster report
exports.getRosterReport = asyncHandler(async (req, res) => {
    const { session_id } = req.params;

    const { data, error } = await supabase
        .from('students')
        .select(`
            student_id,
            first_name,
            last_name,
            attendance!left (status, timestamp)
        `)
        .eq('attendance.session_id', session_id);

    if (error) throw error;

    const roster = data.map(student => ({
        student_id: student.student_id,
        name: `${student.first_name} ${student.last_name}`,
        status: student.attendance[0]?.status || 'absent',
        timestamp: student.attendance[0]?.timestamp || null
    }));

    res.json({
        success: true,
        query: 'SELECT first_name||" "||last_name name, COALESCE(status,"absent") status FROM students s LEFT JOIN attendance a ON s.student_id=a.student_id WHERE a.session_id=$1',
        count: roster.length,
        data: roster
    });
});

// Monthly average report
exports.getMonthlyReport = asyncHandler(async (req, res) => {
    const { class_id } = req.params;
    const { start_date, end_date } = req.query;

    const { data: dailyStats, error } = await supabase
        .from('sessions')
        .select(`
            session_id,
            session_date,
            classes:class_id (class_name),
            attendance (status)
        `)
        .eq('class_id', class_id)
        .gte('session_date', start_date)
        .lte('session_date', end_date);

    if (error) throw error;

    const dailyRates = dailyStats.map(session => {
        const total = session.attendance?.length || 0;
        const present = session.attendance?.filter(a => a.status === 'present').length || 0;
        return total > 0 ? (present / total) * 100 : 0;
    });

    const monthlyAvg = dailyRates.length > 0 
        ? (dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length).toFixed(2)
        : 0;

    res.json({
        success: true,
        query: 'SELECT class_name, AVG(attendance_pct) monthly_avg FROM (daily query) WHERE session_date BETWEEN $1 AND $2 GROUP BY class_name',
        data: {
            class_name: dailyStats[0]?.classes?.class_name,
            monthly_avg: monthlyAvg,
            total_sessions: dailyStats.length
        }
    });
});