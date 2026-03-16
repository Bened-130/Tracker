-- Seed data
INSERT INTO classes (class_name, description, teacher_name) VALUES
('Mathematics 101', 'Introduction to Algebra', 'Dr. Sarah Johnson'),
('Computer Science', 'Programming Fundamentals', 'Prof. Michael Chen'),
('Physics', 'Mechanics and Thermodynamics', 'Dr. Emily Brown');

-- Sample sessions
INSERT INTO sessions (class_id, session_date, start_time, end_time, location)
SELECT 
    class_id,
    CURRENT_DATE + (random() * 7)::int,
    '09:00:00'::time + (random() * 8)::int * interval '1 hour',
    '10:30:00'::time + (random() * 8)::int * interval '1 hour',
    CASE (random() * 3)::int 
        WHEN 0 THEN 'Room A101'
        WHEN 1 THEN 'Room B205'
        ELSE 'Lab 3'
    END
FROM classes
CROSS JOIN generate_series(1, 3);