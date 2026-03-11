CREATE OR REPLACE FUNCTION get_daily_attendance(p_session_id INTEGER)
RETURNS TABLE (
    class_name VARCHAR,
    total BIGINT,
    present BIGINT,
    pct DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.class_name,
        COUNT(a.student_id) as total,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
        ROUND(100.0 * SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.student_id), 0), 2) as pct
    FROM classes c
    JOIN sessions s ON c.class_id = s.class_id
    LEFT JOIN attendance a ON s.session_id = a.session_id
    WHERE s.session_id = p_session_id
    GROUP BY c.class_id, c.class_name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_absent_students(p_session_id INTEGER)
RETURNS TABLE (
    student_id INTEGER,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        s.email
    FROM students s
    JOIN enrollments e ON s.student_id = e.student_id
    JOIN sessions ses ON e.class_id = ses.class_id
    WHERE ses.session_id = p_session_id
    AND s.is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM attendance a 
        WHERE a.session_id = p_session_id 
        AND a.student_id = s.student_id
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_attendance_streak(p_student_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    streak INTEGER := 0;
    current_streak INTEGER := 0;
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT status, session_date
        FROM attendance a
        JOIN sessions s ON a.session_id = s.session_id
        WHERE a.student_id = p_student_id
        ORDER BY s.session_date DESC
    LOOP
        IF rec.status = 'present' THEN
            current_streak := current_streak + 1;
            streak := GREATEST(streak, current_streak);
        ELSE
            current_streak := 0;
        END IF;
    END LOOP;
    
    RETURN streak;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_monthly_summary(
    p_class_id INTEGER,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    month DATE,
    class_name VARCHAR,
    avg_attendance DECIMAL,
    total_sessions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC('month', s.session_date)::DATE as month,
        c.class_name,
        ROUND(AVG(
            100.0 * COUNT(CASE WHEN a.status = 'present' THEN 1 END) / 
            NULLIF(COUNT(a.student_id), 0)
        ), 2) as avg_attendance,
        COUNT(DISTINCT s.session_id) as total_sessions
    FROM classes c
    JOIN sessions s ON c.class_id = s.class_id
    LEFT JOIN attendance a ON s.session_id = a.session_id
    WHERE c.class_id = p_class_id
    AND s.session_date BETWEEN p_start_date AND p_end_date
    GROUP BY DATE_TRUNC('month', s.session_date), c.class_id, c.class_name
    ORDER BY month;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION find_similar_faces(
    query_descriptor JSONB,
    threshold DECIMAL DEFAULT 0.6
)
RETURNS TABLE (
    student_id INTEGER,
    first_name VARCHAR,
    last_name VARCHAR,
    similarity DECIMAL
) AS $$
DECLARE
    query_vector DECIMAL[];
BEGIN
    query_vector := ARRAY(SELECT jsonb_array_elements_text(query_descriptor))::DECIMAL[];
    
    RETURN QUERY
    SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        1 - (
            SELECT SQRT(SUM((d.elem - q.elem)^2))
            FROM unnest(
                ARRAY(SELECT jsonb_array_elements_text(s.face_descriptors))::DECIMAL[]
            ) WITH ORDINALITY AS d(elem, idx),
            unnest(query_vector) WITH ORDINALITY AS q(elem, idx)
            WHERE d.idx = q.idx
        ) / 128.0 as similarity
    FROM students s
    WHERE s.face_descriptors IS NOT NULL
    HAVING 1 - (
        SELECT SQRT(SUM((d.elem - q.elem)^2))
        FROM unnest(
            ARRAY(SELECT jsonb_array_elements_text(s.face_descriptors))::DECIMAL[]
        ) WITH ORDINALITY AS d(elem, idx),
        unnest(query_vector) WITH ORDINALITY AS q(elem, idx)
        WHERE d.idx = q.idx
    ) / 128.0 > threshold;
END;
$$ LANGUAGE plpgsql;