// backend/controllers/reportController.js
// Attendance reports and analytics

const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

// Daily attendance report using database function
exports.getDailyReport = asyncHandler(async (req, res) => {
  const { session_id } = req.params;

  // Use database function if available, otherwise calculate manually
  const { data: reportData, error } = await supabase
    .rpc('get_daily_attendance', {
      p_session_id: parseInt(session_id)
    });

  if (error) {
    // Fallback to manual calculation
    const { data: manualData, error: manualError } = await getDailyReportManual(session_id);
    if (manualError) throw manualError;
    
    return res.json({
      success: true,
      source: 'manual_calculation',
      data: manualData
    });
  }

  res.json({
    success: true,
    source: 'database_function',
    data: reportData
  });
});

// Manual daily report calculation (fallback)
async function getDailyReportManual(session_id) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      session_id,
      classes:class_id (class_name),
      attendance (
        student_id,
        status
      )
    `)
    .eq('session_id', session_id)
    .single();

  if (error) return { data: null, error };

  const attendance = data.attendance || [];
  const total = attendance.length;
  const present = attendance.filter(a => a.status === 'present').length;
  const absent = attendance.filter(a => a.status === 'absent').length;
  const late = attendance.filter(a => a.status === 'late').length;
  const excused = attendance.filter(a => a.status === 'excused').length;

  return {
    data: [{
      class_name: data.classes.class_name,
      total,
      present,
      absent,
      late,
      excused,
      pct: total > 0 ? ((present + late) / total * 100).toFixed(2) : 0
    }],
    error: null
  };
}

// Class roster report with attendance status
exports.getRosterReport = asyncHandler(async (req, res) => {
  const { session_id } = req.params;

  // Get session info
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      session_id,
      session_date,
      classes:class_id (class_name)
    `)
    .eq('session_id', session_id)
    .single();

  if (sessionError) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Session not found'
    });
  }

  // Get enrolled students with attendance status
  const { data: roster, error } = await supabase
    .from('enrollments')
    .select(`
      students:student_id (
        student_id,
        first_name,
        last_name,
        email,
        student_number,
        attendance!left (
          status,
          timestamp,
          facial_confidence,
          verification_method
        )
      )
    `)
    .eq('class_id', session.classes.class_id);

  if (error) throw error;

  // Format response
  const formattedRoster = roster.map(enrollment => {
    const student = enrollment.students;
    const attendance = student.attendance?.find(a => a.session_id === parseInt(session_id));
    
    return {
      student_id: student.student_id,
      name: `${student.first_name} ${student.last_name}`,
      email: student.email,
      student_number: student.student_number,
      status: attendance?.status || 'absent',
      timestamp: attendance?.timestamp || null,
      facial_confidence: attendance?.facial_confidence || null,
      verification_method: attendance?.verification_method || null
    };
  });

  // Sort: present first, then late, then absent
  const statusOrder = { present: 0, late: 1, excused: 2, absent: 3 };
  formattedRoster.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  res.json({
    success: true,
    session: {
      session_id: parseInt(session_id),
      date: session.session_date,
      class_name: session.classes.class_name
    },
    summary: {
      total: formattedRoster.length,
      present: formattedRoster.filter(s => s.status === 'present').length,
      late: formattedRoster.filter(s => s.status === 'late').length,
      absent: formattedRoster.filter(s => s.status === 'absent').length,
      excused: formattedRoster.filter(s => s.status === 'excused').length
    },
    data: formattedRoster
  });
});

// Monthly summary report
exports.getMonthlyReport = asyncHandler(async (req, res) => {
  const { class_id } = req.params;
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Start date and end date are required (YYYY-MM-DD format)'
    });
  }

  // Get all sessions in date range
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select(`
      session_id,
      session_date,
      attendance (
        student_id,
        status
      )
    `)
    .eq('class_id', class_id)
    .gte('session_date', start_date)
    .lte('session_date', end_date)
    .order('session_date');

  if (sessionsError) throw sessionsError;

  // Get class info
  const { data: classData } = await supabase
    .from('classes')
    .select('class_name')
    .eq('class_id', class_id)
    .single();

  // Calculate daily rates
  const dailyStats = sessions.map(session => {
    const attendance = session.attendance || [];
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    
    return {
      date: session.session_date,
      total_students: total,
      present: present,
      rate: total > 0 ? (present / total * 100).toFixed(2) : 0
    };
  });

  // Group by month
  const monthlyStats = {};
  dailyStats.forEach(day => {
    const month = day.date.substring(0, 7); // YYYY-MM
    if (!monthlyStats[month]) {
      monthlyStats[month] = {
        days: [],
        total_present: 0,
        total_count: 0
      };
    }
    monthlyStats[month].days.push(day);
    monthlyStats[month].total_present += day.present;
    monthlyStats[month].total_count += day.total_students;
  });

  const monthlyData = Object.entries(monthlyStats).map(([month, stats]) => ({
    month,
    total_sessions: stats.days.length,
    average_attendance: stats.total_count > 0 
      ? (stats.total_present / stats.total_count * 100).toFixed(2) 
      : 0,
    lowest_day: stats.days.reduce((min, d) => parseFloat(d.rate) < parseFloat(min.rate) ? d : min, stats.days[0]),
    highest_day: stats.days.reduce((max, d) => parseFloat(d.rate) > parseFloat(max.rate) ? d : max, stats.days[0])
  }));

  // Overall statistics
  const overallStats = {
    total_sessions: sessions.length,
    average_attendance: dailyStats.length > 0
      ? (dailyStats.reduce((sum, d) => sum + parseFloat(d.rate), 0) / dailyStats.length).toFixed(2)
      : 0,
    date_range: { start_date, end_date }
  };

  res.json({
    success: true,
    class: {
      class_id: parseInt(class_id),
      class_name: classData?.class_name
    },
    overall: overallStats,
    monthly: monthlyData,
    daily: dailyStats
  });
});

// Student attendance report
exports.getStudentReport = asyncHandler(async (req, res) => {
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
        classes:class_id (class_name)
      )
    `)
    .eq('student_id', student_id)
    .order('timestamp', { ascending: false });

  if (start_date) query = query.gte('sessions.session_date', start_date);
  if (end_date) query = query.lte('sessions.session_date', end_date);

  const { data: attendance, error } = await query;

  if (error) throw error;

  // Calculate statistics
  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    late: attendance.filter(a => a.status === 'late').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    excused: attendance.filter(a => a.status === 'excused').length,
    avg_confidence: attendance
      .filter(a => a.facial_confidence)
      .reduce((sum, a) => sum + a.facial_confidence, 0) / attendance.filter(a => a.facial_confidence).length || 0
  };

  stats.attendance_rate = stats.total > 0 
    ? ((stats.present + stats.late) / stats.total * 100).toFixed(2)
    : 0;

  res.json({
    success: true,
    student_id: parseInt(student_id),
    stats,
    data: attendance
  });
});

// Export report as CSV
exports.exportReport = asyncHandler(async (req, res) => {
  const { type, session_id, class_id, start_date, end_date } = req.query;

  let csvData = [];
  let filename = `report_${new Date().toISOString().split('T')[0]}.csv`;

  if (type === 'roster' && session_id) {
    const { data } = await exports.getRosterReport({ params: { session_id } }, { json: () => {} });
    filename = `roster_session_${session_id}.csv`;
    
    csvData = [
      ['Student ID', 'Name', 'Email', 'Status', 'Timestamp', 'Method'],
      ...data.data.map(s => [
        s.student_id,
        s.name,
        s.email,
        s.status,
        s.timestamp || '',
        s.verification_method || ''
      ])
    ];
  }

  // Convert to CSV string
  const csv = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});