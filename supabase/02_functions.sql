-- Get daily attendance statistics
CREATE OR REPLACE FUNCTION get_daily_attendance(session_uuid UUID)
RETURNS TABLE (
    class_name VARCHAR,
    total BIGINT,
    present BIGINT,
    late BIGINT,
    absent BIGINT,
    pct INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.class_name,
        COUNT(s.student_id) as total,
        COUNT(a.attendance_id) FILTER (WHERE a.status = 'present') as present,
        COUNT(a.attendance_id) FILTER (WHERE a.status = 'late') as late,
        (COUNT(s.student_id) - COUNT(a.attendance_id)) as absent,
        CASE 
            WHEN COUNT(s.student_id) > 0 
            THEN ROUND((COUNT(a.attendance_id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(s.student_id)) * 100)
            ELSE 0
        END as pct
    FROM classes c
    JOIN sessions sess ON c.class_id = sess.class_id
    LEFT JOIN students s ON c.class_id = s.class_id
    LEFT JOIN attendance a ON s.student_id = a.student_id AND a.session_id = session_uuid
    WHERE sess.session_id = session_uuid
    GROUP BY c.class_id, c.class_name;
END;
$$ LANGUAGE plpgsql;