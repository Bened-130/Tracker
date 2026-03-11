INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@schoolvibe.edu', '$2b$10$...', 'Admin', 'User', 'admin'),
('teacher1@schoolvibe.edu', '$2b$10$...', 'Sarah', 'Johnson', 'teacher'),
('teacher2@schoolvibe.edu', '$2b$10$...', 'Michael', 'Chen', 'teacher');

INSERT INTO classes (class_name, description, room_number, schedule) VALUES
('Mathematics 101', 'Introduction to Calculus and Algebra', 'Room 301', '{"monday": "09:00-10:30", "wednesday": "09:00-10:30"}'),
('Physics Advanced', 'Advanced Physics and Lab Work', 'Lab 205', '{"tuesday": "10:00-12:00", "thursday": "10:00-12:00"}'),
('Computer Science', 'Programming Fundamentals', 'Lab 102', '{"monday": "13:00-15:00", "friday": "13:00-15:00"}'),
('Literature', 'World Literature Analysis', 'Room 201', '{"tuesday": "14:00-15:30", "thursday": "14:00-15:30"}'),
('Chemistry Lab', 'Organic Chemistry Laboratory', 'Lab 305', '{"wednesday": "10:00-12:00", "friday": "10:00-12:00"});

DO $$
DECLARE
    i INTEGER;
    first_names TEXT[] := ARRAY['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra'];
    last_names TEXT[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];
    random_descriptor DECIMAL[];
BEGIN
    FOR i IN 1..50 LOOP
        SELECT ARRAY_AGG(RANDOM()::DECIMAL) INTO random_descriptor
        FROM generate_series(1, 128);
        
        INSERT INTO students (first_name, last_name, email, student_number, face_descriptors)
        VALUES (
            first_names[1 + (i % array_length(first_names, 1))],
            last_names[1 + (i % array_length(last_names, 1))],
            'student' || i || '@schoolvibe.edu',
            'STU' || LPAD(i::TEXT, 4, '0'),
            to_jsonb(random_descriptor)
        );
    END LOOP;
END $$;

INSERT INTO enrollments (student_id, class_id)
SELECT s.student_id, c.class_id
FROM students s
CROSS JOIN classes c
WHERE s.student_id <= 50
ON CONFLICT DO NOTHING;

INSERT INTO sessions (class_id, session_date, start_time, end_time)
SELECT 
    c.class_id,
    CURRENT_DATE + (generate_series(0, 4) - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER),
    '09:00:00',
    '10:30:00'
FROM classes c
WHERE c.class_name = 'Mathematics 101';

INSERT INTO attendance (session_id, student_id, status, facial_confidence, verification_method)
SELECT 
    s.session_id,
    st.student_id,
    CASE WHEN RANDOM() > 0.2 THEN 'present' ELSE 'absent' END,
    CASE WHEN RANDOM() > 0.2 THEN RANDOM()::DECIMAL(5,4) ELSE NULL END,
    CASE WHEN RANDOM() > 0.2 THEN 'facial_recognition' ELSE 'manual' END
FROM sessions s
CROSS JOIN students st
WHERE st.student_id <= 30
ON CONFLICT DO NOTHING;