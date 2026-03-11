const { supabase } = require('../config/database');

class AttendanceService {
    async getStatistics(classId, startDate, endDate) {
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                session_id,
                session_date,
                attendance (
                    status,
                    student_id
                )
            `)
            .eq('class_id', classId)
            .gte('session_date', startDate)
            .lte('session_date', endDate);

        if (error) throw error;

        const stats = {
            total_sessions: data.length,
            total_checkins: 0,
            by_date: {},
            by_student: {}
        };

        for (const session of data) {
            const date = session.session_date;
            if (!stats.by_date[date]) {
                stats.by_date[date] = { present: 0, absent: 0, late: 0, total: 0 };
            }

            for (const record of (session.attendance || [])) {
                stats.total_checkins++;
                stats.by_date[date][record.status]++;
                stats.by_date[date].total++;

                if (!stats.by_student[record.student_id]) {
                    stats.by_student[record.student_id] = { present: 0, absent: 0, late: 0, total: 0 };
                }
                stats.by_student[record.student_id][record.status]++;
                stats.by_student[record.student_id].total++;
            }
        }

        return stats;
    }

    async getAtRiskStudents(classId, threshold = 75) {
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                student_id,
                status,
                students:student_id (first_name, last_name, email)
            `)
            .eq('sessions.class_id', classId);

        if (error) throw error;

        const studentStats = {};
        for (const record of data) {
            if (!studentStats[record.student_id]) {
                studentStats[record.student_id] = {
                    student: record.students,
                    present: 0,
                    total: 0
                };
            }
            studentStats[record.student_id].total++;
            if (record.status === 'present') {
                studentStats[record.student_id].present++;
            }
        }

        const atRisk = Object.values(studentStats)
            .filter(s => (s.present / s.total) * 100 < threshold)
            .map(s => ({
                ...s.student,
                attendance_rate: ((s.present / s.total) * 100).toFixed(2),
                present_count: s.present,
                total_sessions: s.total
            }));

        return atRisk;
    }

    async markAbsentees(sessionId, autoMark = true) {
        const { data: absentees, error } = await supabase.rpc('get_absent_students', {
            p_session_id: sessionId
        });

        if (error) throw error;

        if (!autoMark) {
            return { count: absentees.length, students: absentees };
        }

        const absentRecords = absentees.map(student => ({
            session_id: sessionId,
            student_id: student.student_id,
            status: 'absent',
            timestamp: new Date().toISOString(),
            verification_method: 'auto_marked'
        }));

        const { data, error: insertError } = await supabase
            .from('attendance')
            .insert(absentRecords);

        if (insertError) throw insertError;

        return {
            marked: absentRecords.length,
            students: absentees
        };
    }
}

module.exports = new AttendanceService();