const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getDailyReport = asyncHandler(async (req, res) => {
    const { session_id } = req.params;

    const { data, error } = await supabase.rpc('get_daily_attendance', {
        p_session_id: parseInt(session_id)
    });

    if (error) {
        const { data: manualData, error: manualError } = await supabase
            .from('sessions')
            .select(`
                session_id,
                classes:class_id (
                    class_name
                ),
                attendance (
                    student_id,
                    status
                )
            `)
            .eq('session_id', session_id)
            .single();

        if (manualError) throw manualError;

        const attendance = manualData.attendance || [];
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;
        const absent = attendance.filter(a => a.status === 'absent').length;
        const late = attendance.filter(a => a.status === 'late').length;

        return res.json({
            success: true,
            query: `-- Daily Report
SELECT c.class_name, 
       COUNT(a.student_id) total, 
       SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) present,
       ROUND(100.0*SUM(CASE WHEN status='present' THEN 1 ELSE 0 END)/NULLIF(COUNT(a.student_id),0),2) pct 
FROM classes c 
JOIN sessions s ON c.class_id=s.class_id 
LEFT JOIN attendance a ON s.session_id=a.session_id 
WHERE s.session_id=${session_id} 
GROUP BY c.class_id`,
            data: [{
                class_name: manualData.classes.class_name,
                total: total,
                present: present,
                absent: absent,
                late: late,
                pct: total > 0 ? ((present / total) * 100).toFixed(2) : 0
            }]
        });
    }

    res.json({
        success: true,
        query: `SELECT c.class_name, COUNT(a.student_id) total, SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) present, ROUND(100.0*present/total,2) pct FROM classes c JOIN sessions s ON c.class_id=s.class_id LEFT JOIN attendance a ON s.session_id=a.session_id WHERE s.session_id=${session_id} GROUP BY c.class_id`,
        data: data
    });
});

exports.getRosterReport = asyncHandler(async (req, res) => {
    const { session_id } = req.params;

    const { data, error } = await supabase
        .from('students')
        .select(`
            student_id,
            first_name,
            last_name,
            attendance!left (
                status,
                timestamp
            )
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
        query: `SELECT first_name||' '||last_name name, COALESCE(status,'absent') status FROM students s LEFT JOIN attendance a ON s.student_id=a.student_id WHERE a.session_id=${session_id}`,
        count: roster.length,
        data: roster
    });
});

exports.getMonthlyReport = asyncHandler(async (req, res) => {
    const { class_id } = req.params;
    const { start_date, end_date } = req.query;

    const { data: dailyStats, error } = await supabase
        .from('sessions')
        .select(`
            session_id,
            session_date,
            classes:class_id (class_name),
            attendance (
                status
            )
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
        query: `SELECT class_name, AVG(attendance_pct) monthly_avg FROM (daily query) WHERE session_date BETWEEN '${start_date}' AND '${end_date}' GROUP BY class_name`,
        data: {
            class_name: dailyStats[0]?.classes?.class_name,
            monthly_avg: monthlyAvg,
            total_sessions: dailyStats.length,
            daily_breakdown: dailyStats.map(s => ({
                date: s.session_date,
                rate: dailyRates[dailyStats.indexOf(s)].toFixed(2)
            }))
        }
    });
});

exports.exportReport = asyncHandler(async (req, res) => {
    const { type, format = 'csv' } = req.params;
    const filters = req.query;

    let data;
    let filename;

    switch(type) {
        case 'daily':
            const daily = await exports.getDailyReport({ params: filters }, res);
            data = daily.data;
            filename = `daily_report_${filters.session_id}_${new Date().toISOString().split('T')[0]}`;
            break;
        case 'roster':
            const roster = await exports.getRosterReport({ params: filters }, res);
            data = roster.data;
            filename = `roster_${filters.session_id}_${new Date().toISOString().split('T')[0]}`;
            break;
        case 'monthly':
            const monthly = await exports.getMonthlyReport({ params: filters, query: filters }, res);
            data = monthly.data;
            filename = `monthly_report_${filters.class_id}_${filters.start_date}_${filters.end_date}`;
            break;
        default:
            return res.status(400).json({ error: 'Invalid report type' });
    }

    if (format === 'csv') {
        const csv = convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(csv);
    } else if (format === 'json') {
        res.json({
            success: true,
            export_date: new Date().toISOString(),
            data: data
        });
    } else {
        res.status(400).json({ error: 'Unsupported format' });
    }
});

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => 
        headers.map(h => {
            const val = obj[h];
            return `"${(val !== null && val !== undefined ? String(val).replace(/"/g, '""') : '')}"`;
        }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
}