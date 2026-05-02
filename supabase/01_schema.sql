-- SchoolVibe AI Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Classes table
CREATE TABLE classes (
    class_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name VARCHAR(100) NOT NULL,
    description TEXT,
    teacher_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table with face descriptors
CREATE TABLE students (
    student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    class_id UUID REFERENCES classes(class_id) ON DELETE SET NULL,
    face_descriptor JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance records
CREATE TABLE attendance (
    attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    method VARCHAR(20) DEFAULT 'face' CHECK (method IN ('face', 'manual', 'card')),
    notes TEXT,
    UNIQUE(student_id, session_id)
);

-- Indexes
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_sessions_class ON sessions(class_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_session ON attendance(session_id);

-- Hostel and library administration tables
CREATE TABLE hostel_blocks (
    hostel_block_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_name VARCHAR(100) NOT NULL,
    block_type VARCHAR(50) NOT NULL,
    total_rooms INTEGER DEFAULT 0,
    floor_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE hostel_bookings (
    hostel_booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(student_id) ON DELETE SET NULL,
    student_name VARCHAR(100) NOT NULL,
    block_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE library_books (
    library_book_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    author VARCHAR(150),
    copies INTEGER DEFAULT 1,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE library_borrows (
    library_borrow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(student_id) ON DELETE SET NULL,
    student_name VARCHAR(100) NOT NULL,
    book_title VARCHAR(200) NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE school_calendar (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    audience VARCHAR(100) DEFAULT 'All',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE fees (
    fee_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    paid NUMERIC(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('paid','pending','overdue')),
    due_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE results (
    result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(10),
    score NUMERIC(5,2),
    term VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES students(student_id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type VARCHAR(50),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hostel_bookings_student ON hostel_bookings(student_id);
CREATE INDEX idx_library_borrows_student ON library_borrows(student_id);
CREATE INDEX idx_school_calendar_date ON school_calendar(event_date);
CREATE INDEX idx_fees_student ON fees(student_id);
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();