const { supabase, verifyToken } = require('./utils/supabase');

exports.reportsHandler = async (event, context, headers) => {
  const method = event.httpMethod;
  const segments = event.path.split('/').filter(Boolean);

  // GET /api/reports/daily/:session_id
  if (method === 'GET' && segments[1] === 'daily') {
    const sessionId = segments[2];
    
    // Use Supabase RPC for aggregated data
    const { data, error } = await supabase
      .rpc('get_daily_attendance', { session_id: sessionId });

    if (error) {
      // Fallback if RPC not available
      const { data: attendance, error: attError } = await supabase
        .from('attendance')
        .select('status')
        .eq('session_id', sessionId);

      if (attError) throw attError;

      const stats = {
        present: attendance.filter(a => a.status === 'present').length,
        late: attendance.filter(a => a.status === 'late').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        total: attendance.length
      };
      stats.pct = Math.round((stats.present + stats.late) / stats.total * 100) || 0;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          data: [{ ...stats, class_name: 'Unknown' }] 
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data })
    };
  }

  // GET /api/reports/roster/:session_id
  if (method === 'GET' && segments[1] === 'roster') {
    const sessionId = segments[2];

    const { data: students, error } = await supabase
      .from('students')
      .select(`
        student_id,
        first_name,
        last_name,
        attendance!inner(status, timestamp)
      `)
      .eq('attendance.session_id', sessionId);

    if (error) throw error;

    const formatted = students.map(s => ({
      student_id: s.student_id,
      name: `${s.first_name} ${s.last_name}`,
      status: s.attendance[0]?.status || 'absent',
      timestamp: s.attendance[0]?.timestamp
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: formatted, count: formatted.length })
    };
  }

  // GET /api/reports/monthly/:class_id
  if (method === 'GET' && segments[1] === 'monthly') {
    const classId = segments[2];
    const { start_date, end_date } = event.queryStringParameters || {};

    // Get all sessions in date range
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('session_id, session_date')
      .eq('class_id', classId)
      .gte('session_date', start_date || new Date().toISOString().slice(0, 7) + '-01')
      .lte('session_date', end_date || new Date().toISOString().split('T')[0]);

    if (error) throw error;

    // Get attendance for all sessions
    const sessionIds = sessions.map(s => s.session_id);
    const { data: attendance } = await supabase
      .from('attendance')
      .select('session_id, status')
      .in('session_id', sessionIds);

    // Calculate stats
    const totalRecords = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const late = attendance.filter(a => a.status === 'late').length;

    const report = {
      class_id: classId,
      class_name: 'Class Report',
      total_sessions: sessions.length,
      monthly_avg: totalRecords ? Math.round((present + late) / totalRecords * 100) : 0,
      daily_breakdown: sessions.map(s => {
        const dayAtt = attendance.filter(a => a.session_id === s.session_id);
        const dayTotal = dayAtt.length;
        const dayPresent = dayAtt.filter(a => a.status === 'present' || a.status === 'late').length;
        return {
          date: s.session_date,
          rate: dayTotal ? Math.round(dayPresent / dayTotal * 100) : 0
        };
      })
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: report })
    };
  }

  return { statusCode: 404, headers, body: JSON.stringify({ error: 'Report type not found' }) };
};