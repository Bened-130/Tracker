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

-- Sample students for admin history and hostel/library operations
INSERT INTO students (first_name, last_name, email, class_id)
SELECT 'Amina', 'Ali', 'amina.ali@example.com', class_id FROM classes WHERE class_name = 'Mathematics 101' LIMIT 1;

INSERT INTO students (first_name, last_name, email, class_id)
SELECT 'Joseph', 'Kim', 'joseph.kim@example.com', class_id FROM classes WHERE class_name = 'Physics' LIMIT 1;

INSERT INTO students (first_name, last_name, email, class_id)
SELECT 'Mia', 'Chen', 'mia.chen@example.com', class_id FROM classes WHERE class_name = 'Computer Science' LIMIT 1;

-- Hostel blocks and sample booking
INSERT INTO hostel_blocks (block_name, block_type, total_rooms, floor_count)
VALUES
('East Wing', 'Male', 18, 3),
('West Wing', 'Female', 20, 3),
('Central Hall', 'Mixed', 12, 2);

INSERT INTO hostel_bookings (student_id, student_name, block_name, room_number, check_in, check_out, status)
SELECT student_id, CONCAT(first_name, ' ', last_name), 'East Wing', 'E-12', CURRENT_DATE - 30, CURRENT_DATE + 150, 'active'
FROM students
WHERE first_name = 'Amina' AND last_name = 'Ali'
LIMIT 1;

-- Library inventory and borrowed records
INSERT INTO library_books (title, author, copies, category)
VALUES
('Mathematics Essentials', 'R. Singh', 8, 'Math'),
('English Grammar', 'M. Taylor', 5, 'Language'),
('Physics Fundamentals', 'S. Roberts', 6, 'Science');

INSERT INTO library_borrows (student_id, student_name, book_title, borrow_date, due_date, status)
SELECT student_id, CONCAT(first_name, ' ', last_name), 'English Grammar', CURRENT_DATE - 10, CURRENT_DATE + 8, 'borrowed'
FROM students
WHERE first_name = 'Mia' AND last_name = 'Chen'
LIMIT 1;

-- School calendar seed events
INSERT INTO school_calendar (title, event_date, audience, description)
VALUES
('School Opening Assembly', '2025-06-01', 'All', 'Welcome assembly for the new academic year.'),
('Parent-Teacher Conference', '2025-06-15', 'Parents', 'Discuss student progress and attendance.'),
('Library Week', '2025-07-05', 'Students', 'Book fair, reading sessions, and library visits.');

-- Fees and results sample
INSERT INTO fees (student_id, amount, paid, status, due_date, description)
SELECT student_id, 1200.00, 1200.00, 'paid', CURRENT_DATE + 30, 'Term fee payment'
FROM students
WHERE first_name = 'Amina' AND last_name = 'Ali'
LIMIT 1;

INSERT INTO fees (student_id, amount, paid, status, due_date, description)
SELECT student_id, 1400.00, 0.00, 'pending', CURRENT_DATE + 45, 'Term fee balance'
FROM students
WHERE first_name = 'Joseph' AND last_name = 'Kim'
LIMIT 1;

INSERT INTO results (student_id, subject, grade, score, term)
SELECT student_id, 'Mathematics', 'A', 94, 'Spring 2025'
FROM students
WHERE first_name = 'Amina' AND last_name = 'Ali'
LIMIT 1;

INSERT INTO results (student_id, subject, grade, score, term)
SELECT student_id, 'Science', 'A', 95, 'Spring 2025'
FROM students
WHERE first_name = 'Mia' AND last_name = 'Chen'
LIMIT 1;